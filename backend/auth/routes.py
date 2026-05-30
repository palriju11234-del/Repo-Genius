"""
Auth routes — Google & GitHub OAuth 2.0 (backend-driven flow).

Flow:
  1. Browser  → GET /api/auth/{provider}/login   → redirect to provider
  2. Provider → GET /api/auth/{provider}/callback → exchange code, set cookie, redirect to frontend
  3. Browser  → GET /api/auth/me                  → return current user from cookie
  4. Browser  → POST /api/auth/logout             → clear cookie
  5. Browser  → POST /api/auth/exchange           → swap URL token for HttpOnly cookie
"""
import logging
import secrets
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Cookie, Response
from fastapi.responses import JSONResponse, RedirectResponse

from backend.auth.jwt_handler import create_token, decode_token
from backend.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["Auth"])

COOKIE_NAME = "rg_session"

# ── Redirect URIs: always use fixed backend URL from config so they match
# exactly what is registered in Google Cloud Console / GitHub OAuth App.

def _google_redirect_uri() -> str:
    backend = settings.backend_url.rstrip("/")
    return f"{backend}/api/auth/google/callback"

def _github_redirect_uri() -> str:
    backend = settings.backend_url.rstrip("/")
    return f"{backend}/api/auth/github/callback"

# ── Helpers ───────────────────────────────────────────────────────────────────

def _set_session_cookie(response: Response, user: dict) -> None:
    token = create_token(user)
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,              # set True in production (HTTPS)
        max_age=60 * 60 * 24 * 7,  # 7 days
        path="/",
    )


def _clear_session_cookie(response: Response) -> None:
    response.delete_cookie(key=COOKIE_NAME, path="/")


def _get_current_user(rg_session: str | None) -> dict | None:
    if not rg_session:
        return None
    return decode_token(rg_session)


def _make_success_redirect(user: dict) -> RedirectResponse:
    """
    Cross-origin dev workaround: embed a short-lived JWT in the redirect URL
    so the frontend can POST it to /exchange and get a proper HttpOnly cookie.
    """
    frontend = settings.frontend_url.rstrip("/")
    token = create_token(user)
    return RedirectResponse(url=f"{frontend}?auth_token={token}", status_code=302)


def _make_error_redirect(error: str) -> RedirectResponse:
    frontend = settings.frontend_url.rstrip("/")
    return RedirectResponse(url=f"{frontend}?error={error}", status_code=302)


# ── /me ───────────────────────────────────────────────────────────────────────

@router.get("/me")
def get_me(rg_session: str | None = Cookie(default=None)):
    """Return the currently authenticated user, or 401."""
    user = _get_current_user(rg_session)
    if not user:
        return JSONResponse(status_code=401, content={"detail": "Not authenticated"})
    return {
        "id": user.get("id"),
        "name": user.get("name"),
        "email": user.get("email"),
        "avatar_url": user.get("avatar_url"),
        "provider": user.get("provider"),
    }


# ── Logout ────────────────────────────────────────────────────────────────────

@router.post("/logout")
def logout():
    response = JSONResponse(content={"detail": "Logged out"})
    _clear_session_cookie(response)
    return response


# ── Token exchange (cross-origin dev workaround) ──────────────────────────────

@router.post("/exchange")
def exchange_token(body: dict, response: Response):
    """
    Accepts { token: "<jwt>" } POSTed by the frontend after OAuth redirect.
    Verifies the token, sets the HttpOnly session cookie, returns user profile.
    """
    token = body.get("token", "")
    user = decode_token(token)
    if not user:
        return JSONResponse(status_code=401, content={"detail": "Invalid or expired token"})
    _set_session_cookie(response, user)
    logger.info("Session established for %s via %s", user.get("email"), user.get("provider"))
    return {
        "id": user.get("id"),
        "name": user.get("name"),
        "email": user.get("email"),
        "avatar_url": user.get("avatar_url"),
        "provider": user.get("provider"),
    }


# ── Google ────────────────────────────────────────────────────────────────────

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
GOOGLE_SCOPES = "openid email profile"


@router.get("/google/login")
def google_login():
    """Redirect the user to Google's OAuth consent screen."""
    if not settings.google_client_id:
        return JSONResponse(
            status_code=503,
            content={"detail": "Google OAuth not configured. Set GOOGLE_CLIENT_ID in .env"},
        )
    state = secrets.token_urlsafe(32)
    params = urlencode({
        "client_id": settings.google_client_id,
        "redirect_uri": _google_redirect_uri(),
        "response_type": "code",
        "scope": GOOGLE_SCOPES,
        "access_type": "offline",
        "state": state,
        "prompt": "select_account",
    })
    response = RedirectResponse(url=f"{GOOGLE_AUTH_URL}?{params}")
    response.set_cookie("oauth_state", state, httponly=True, samesite="lax", max_age=600, path="/")
    return response


@router.get("/google/callback")
async def google_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    oauth_state: str | None = Cookie(default=None),
):
    """Handle Google's redirect after the user grants access."""
    if error:
        logger.warning("Google OAuth error: %s", error)
        return _make_error_redirect(error)

    if not code:
        logger.warning("Google callback: no code received")
        return _make_error_redirect("no_code")

    # CSRF state check — in local development, we print a warning but bypass to avoid localhost/127.0.0.1 cookie mismatch
    is_local = "127.0.0.1" in settings.backend_url or "localhost" in settings.backend_url
    if state and oauth_state and state != oauth_state:
        if is_local:
            logger.warning("Google CSRF state mismatch (local dev, bypassing): got %s expected %s", state[:8], oauth_state[:8])
        else:
            logger.warning("Google CSRF state mismatch: got %s expected %s", state[:8], oauth_state[:8])
            return _make_error_redirect("state_mismatch")

    redirect_uri = _google_redirect_uri()
    logger.info("Google callback: exchanging code, redirect_uri=%s", redirect_uri)

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            token_resp = await client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "code": code,
                    "client_id": settings.google_client_id,
                    "client_secret": settings.google_client_secret,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code",
                },
            )
            logger.info("Google token exchange status: %d", token_resp.status_code)
            if token_resp.status_code != 200:
                logger.error("Google token exchange failed: %s", token_resp.text)
                return _make_error_redirect("token_exchange_failed")

            tokens = token_resp.json()
            if "error" in tokens:
                logger.error("Google token error body: %s", tokens)
                return _make_error_redirect("token_exchange_failed")

            access_token = tokens.get("access_token")
            if not access_token:
                logger.error("Google: no access_token in response: %s", tokens)
                return _make_error_redirect("no_access_token")

            userinfo_resp = await client.get(
                GOOGLE_USERINFO_URL,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            if userinfo_resp.status_code != 200:
                logger.error("Google userinfo failed: %d %s", userinfo_resp.status_code, userinfo_resp.text)
                return _make_error_redirect("userinfo_failed")

            profile = userinfo_resp.json()

    except httpx.RequestError as exc:
        logger.exception("Google network error: %s", exc)
        return _make_error_redirect("network_error")

    user = {
        "id": f"google:{profile['id']}",
        "name": profile.get("name", ""),
        "email": profile.get("email", ""),
        "avatar_url": profile.get("picture", ""),
        "provider": "google",
    }
    logger.info("Google OAuth success for %s", user["email"])
    return _make_success_redirect(user)


# ── GitHub ────────────────────────────────────────────────────────────────────

GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"
GITHUB_EMAIL_URL = "https://api.github.com/user/emails"


@router.get("/github/login")
def github_login():
    """Redirect the user to GitHub's OAuth consent screen."""
    if not settings.github_client_id:
        return JSONResponse(
            status_code=503,
            content={"detail": "GitHub OAuth not configured. Set GITHUB_CLIENT_ID in .env"},
        )
    state = secrets.token_urlsafe(32)
    params = urlencode({
        "client_id": settings.github_client_id,
        "redirect_uri": _github_redirect_uri(),
        "scope": "read:user user:email",
        "state": state,
    })
    response = RedirectResponse(url=f"{GITHUB_AUTH_URL}?{params}")
    response.set_cookie("oauth_state", state, httponly=True, samesite="lax", max_age=600, path="/")
    return response


@router.get("/github/callback")
async def github_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    error_description: str | None = None,
    oauth_state: str | None = Cookie(default=None),
):
    """Handle GitHub's redirect after the user grants access."""
    if error:
        logger.warning("GitHub OAuth error: %s — %s", error, error_description)
        return _make_error_redirect(error)

    if not code:
        logger.warning("GitHub callback: no code received")
        return _make_error_redirect("no_code")

    # CSRF state check — in local development, we print a warning but bypass to avoid localhost/127.0.0.1 cookie mismatch
    is_local = "127.0.0.1" in settings.backend_url or "localhost" in settings.backend_url
    if state and oauth_state and state != oauth_state:
        if is_local:
            logger.warning("GitHub CSRF state mismatch (local dev, bypassing): got %s expected %s", state[:8], oauth_state[:8])
        else:
            logger.warning("GitHub CSRF state mismatch")
            return _make_error_redirect("state_mismatch")

    logger.info("GitHub callback: exchanging code for token")

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            # Exchange code for access token
            token_resp = await client.post(
                GITHUB_TOKEN_URL,
                data={
                    "client_id": settings.github_client_id,
                    "client_secret": settings.github_client_secret,
                    "code": code,
                    "redirect_uri": _github_redirect_uri(),
                },
                headers={"Accept": "application/json"},
            )
            logger.info("GitHub token exchange status: %d body: %s", token_resp.status_code, token_resp.text[:200])

            tokens = token_resp.json()

            # GitHub ALWAYS returns HTTP 200; errors are in the body
            if "error" in tokens:
                logger.error("GitHub token error: %s — %s", tokens.get("error"), tokens.get("error_description"))
                return _make_error_redirect(tokens["error"])

            access_token = tokens.get("access_token")
            if not access_token:
                logger.error("GitHub: no access_token in response: %s", tokens)
                return _make_error_redirect("no_access_token")

            api_headers = {
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
            }

            # Fetch user profile
            user_resp = await client.get(GITHUB_USER_URL, headers=api_headers)
            logger.info("GitHub user profile status: %d", user_resp.status_code)
            if user_resp.status_code != 200:
                logger.error("GitHub userinfo failed: %s", user_resp.text)
                return _make_error_redirect("userinfo_failed")
            profile = user_resp.json()

            # GitHub may not include email in profile; fetch verified emails separately
            email = profile.get("email")
            if not email:
                emails_resp = await client.get(GITHUB_EMAIL_URL, headers=api_headers)
                if emails_resp.status_code == 200:
                    emails = emails_resp.json()
                    # Prefer primary verified email
                    email = next(
                        (e["email"] for e in emails if e.get("primary") and e.get("verified")),
                        None,
                    ) or next(
                        (e["email"] for e in emails if e.get("verified")),
                        None,
                    ) or (emails[0]["email"] if emails else "")

    except httpx.RequestError as exc:
        logger.exception("GitHub network error: %s", exc)
        return _make_error_redirect("network_error")

    user = {
        "id": f"github:{profile['id']}",
        "name": profile.get("name") or profile.get("login", ""),
        "email": email or "",
        "avatar_url": profile.get("avatar_url", ""),
        "provider": "github",
    }
    logger.info("GitHub OAuth success for user: %s (%s)", user["name"], user["email"])
    return _make_success_redirect(user)
