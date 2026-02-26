import React from 'react';
import { Link, useNavigate, useRouterState } from '@tanstack/react-router';
import { Settings, Lock, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LOCK_EVENT } from './AdminPasscodeGate';

export default function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const isAdminRoute = currentPath.startsWith('/admin');

  const handleLock = () => {
    window.dispatchEvent(new Event(LOCK_EVENT));
  };

  const appId = encodeURIComponent(window.location.hostname || 'eduboard-smart-portal');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between max-w-6xl">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src="/assets/uploads/image-5-1.png"
              alt="RS Logo"
              className="h-10 w-10 object-contain rounded bg-white p-0.5 shadow-sm"
            />
            <span className="font-display font-bold text-lg text-foreground hidden sm:block">
              Smart Board Portal
            </span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: '/faculty' })}
              className="gap-1.5 text-sm"
            >
              Faculty Portal
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: '/admin' })}
              className="gap-1.5 text-sm"
            >
              <Settings className="h-4 w-4" />
              Admin
            </Button>
            {isAdminRoute && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLock}
                className="gap-1.5 text-sm border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive hover:border-destructive"
              >
                <Lock className="h-4 w-4" />
                Lock
              </Button>
            )}
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border bg-card mt-auto">
        <div className="container mx-auto px-4 py-6 max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <img
              src="/assets/uploads/image-5-1.png"
              alt="RS Logo"
              className="h-6 w-6 object-contain rounded bg-white p-0.5"
            />
            <span className="font-display font-semibold text-foreground">Smart Board Portal</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <p className="flex items-center gap-1">
            Built with{' '}
            <Heart className="h-3.5 w-3.5 text-accent fill-accent mx-0.5" />{' '}
            using{' '}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${appId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
