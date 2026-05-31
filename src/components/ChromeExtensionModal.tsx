import React, { useEffect, useState } from 'react';

interface ChromeExtensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** If true, shows the full first-time welcome; if false, shows the quick install prompt */
  isFirstTime?: boolean;
}

export const ChromeExtensionModal: React.FC<ChromeExtensionModalProps> = ({
  isOpen,
  onClose,
  isFirstTime = false,
}) => {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<'welcome' | 'install'>('welcome');

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setVisible(true), 10);
      setStep(isFirstTime ? 'welcome' : 'install');
    } else {
      setVisible(false);
    }
  }, [isOpen, isFirstTime]);

  if (!isOpen) return null;

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ backdropFilter: 'blur(12px)', background: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        style={{
          transform: visible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.97)',
          opacity: visible ? 1 : 0,
          transition: 'all 0.32s cubic-bezier(0.16, 1, 0.3, 1)',
          maxWidth: '480px',
          width: '90%',
          background: 'rgba(255,255,255,0.97)',
          borderRadius: '24px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05)',
          overflow: 'hidden',
          fontFamily: "'Inter', -apple-system, sans-serif",
        }}
      >
        {/* Golden top bar */}
        <div style={{
          height: '4px',
          background: 'linear-gradient(90deg, #F59E0B, #FBBF24, #FDE68A, #F59E0B)',
          backgroundSize: '300% 100%',
          animation: 'goldShimmer 2.5s linear infinite',
        }} />

        <div style={{ padding: '32px 32px 28px' }}>

          {step === 'welcome' ? (
            /* ── Welcome Step ── */
            <>
              {/* Badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '20px', padding: '4px 12px', marginBottom: '20px',
                fontSize: '11px', fontWeight: 600, color: '#92400E', letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}>
                <span>✨</span> Welcome to RepoGenius
              </div>

              <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#0a0a0a', marginBottom: '10px', lineHeight: 1.2 }}>
                Supercharge your <br />
                <span style={{
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                }}>GitHub searches</span>
              </h2>
              <p style={{ fontSize: '14px', color: '#6F6F6F', lineHeight: 1.7, marginBottom: '24px' }}>
                The RepoGenius Chrome Extension injects <strong style={{ color: '#111' }}>AI-personalized</strong> repository recommendations directly into GitHub search results — tailored to your experience level, goals, and tech stack.
              </p>

              {/* Feature list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
                {[
                  { icon: '🎯', title: 'Personalized for you', desc: 'Results ranked by your profile, not just popularity' },
                  { icon: '⚡', title: 'Works inside GitHub', desc: 'Sidebar appears automatically on every GitHub search' },
                  { icon: '🤖', title: 'AI-powered insights', desc: 'Groq LLM explains why each repo fits your query' },
                ].map((f) => (
                  <div key={f.title} style={{
                    display: 'flex', gap: '12px', alignItems: 'flex-start',
                    background: '#FAFAFA', border: '1px solid #F0F0F0',
                    borderRadius: '12px', padding: '12px 14px',
                  }}>
                    <span style={{ fontSize: '20px', lineHeight: 1, marginTop: '1px' }}>{f.icon}</span>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#111', marginBottom: '2px' }}>{f.title}</div>
                      <div style={{ fontSize: '12px', color: '#6F6F6F' }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => setStep('install')}
                  style={{
                    flex: 1, padding: '13px 20px',
                    background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                    color: 'white', border: 'none', borderRadius: '12px',
                    fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(245,158,11,0.4)',
                    transition: 'transform 0.15s, box-shadow 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(245,158,11,0.5)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 16px rgba(245,158,11,0.4)'; }}
                >
                  Add to Chrome — It's Free →
                </button>
                <button
                  onClick={handleClose}
                  style={{
                    padding: '13px 16px', background: 'transparent',
                    color: '#9F9F9F', border: '1.5px solid #E5E5E5',
                    borderRadius: '12px', fontSize: '13px', cursor: 'pointer',
                    transition: 'border-color 0.15s, color 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#ccc'; e.currentTarget.style.color = '#333'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E5E5'; e.currentTarget.style.color = '#9F9F9F'; }}
                >
                  Maybe later
                </button>
              </div>
            </>
          ) : (
            /* ── Install Instructions Step ── */
            <>
              <button
                onClick={() => isFirstTime ? setStep('welcome') : handleClose()}
                style={{
                  background: 'none', border: 'none', color: '#9F9F9F',
                  fontSize: '13px', cursor: 'pointer', padding: '0', marginBottom: '20px',
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}
              >
                ← {isFirstTime ? 'Back' : 'Close'}
              </button>

              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '20px', padding: '4px 12px', marginBottom: '16px',
                fontSize: '11px', fontWeight: 600, color: '#92400E',
              }}>
                🔌 Install Extension
              </div>

              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0a0a0a', marginBottom: '8px' }}>
                Load as Unpacked Extension
              </h2>
              <p style={{ fontSize: '13px', color: '#6F6F6F', lineHeight: 1.6, marginBottom: '20px' }}>
                RepoGenius isn't on the Chrome Web Store yet. Follow these steps to load it directly from the project folder:
              </p>

              {/* Steps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                {[
                  { n: '1', text: 'Open Chrome and go to', code: 'chrome://extensions' },
                  { n: '2', text: 'Enable Developer Mode (toggle in the top-right corner)', code: null },
                  { n: '3', text: 'Click "Load unpacked" and select the', code: '/extension' + ' folder in this project' },
                  { n: '4', text: 'RepoGenius will appear in your extensions bar — pin it!', code: null },
                ].map((s) => (
                  <div key={s.n} style={{
                    display: 'flex', gap: '12px', alignItems: 'flex-start',
                    background: '#FAFAFA', border: '1px solid #F0F0F0',
                    borderRadius: '10px', padding: '11px 14px',
                  }}>
                    <div style={{
                      width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                      color: 'white', fontSize: '11px', fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{s.n}</div>
                    <span style={{ fontSize: '12.5px', color: '#333', lineHeight: 1.5 }}>
                      {s.text}
                      {s.code && (
                        <code style={{
                          marginLeft: '4px', background: 'rgba(245,158,11,0.12)',
                          border: '1px solid rgba(245,158,11,0.25)', borderRadius: '5px',
                          padding: '1px 7px', fontFamily: 'monospace', fontSize: '12px',
                          color: '#92400E',
                        }}>{s.code}</code>
                      )}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{
                background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.2)',
                borderRadius: '10px', padding: '11px 14px', fontSize: '12px',
                color: '#78350F', lineHeight: 1.5, marginBottom: '20px',
              }}>
                💡 <strong>Note:</strong> Make sure the backend is running at{' '}
                <code style={{ background: 'rgba(245,158,11,0.15)', padding: '1px 5px', borderRadius: '4px', fontFamily: 'monospace' }}>
                  http://127.0.0.1:8000
                </code>{' '}
                for the extension to work.
              </div>

              <button
                onClick={handleClose}
                style={{
                  width: '100%', padding: '13px',
                  background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                  color: 'white', border: 'none', borderRadius: '12px',
                  fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 16px rgba(245,158,11,0.35)',
                }}
              >
                Got it — Let's go! 🚀
              </button>
            </>
          )}
        </div>

        <style>{`
          @keyframes goldShimmer {
            0%   { background-position: 0% 50%; }
            100% { background-position: 300% 50%; }
          }
        `}</style>
      </div>
    </div>
  );
};
