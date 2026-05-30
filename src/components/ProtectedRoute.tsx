import React from 'react';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  onNotAuthenticated: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, onNotAuthenticated }) => {
  const { isAuthenticated, loading } = useAuth();

  React.useEffect(() => {
    if (!loading && !isAuthenticated) {
      onNotAuthenticated();
    }
  }, [loading, isAuthenticated, onNotAuthenticated]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white z-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-black/10 animate-ping" />
            <div className="absolute inset-0 rounded-full border-2 border-t-black border-transparent animate-spin" />
          </div>
          <p className="text-sm text-[#6F6F6F] font-sans">Loading RepoGenius…</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
};
