import React from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { BookOpen, LayoutDashboard, GraduationCap, Download, Terminal, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/utils/pwa';
import { useIsAdmin } from '@/hooks/useQueries';
import { LOCK_EVENT } from '@/components/AdminPasscodeGate';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const currentPath = location.pathname;
  const { isInstallable, promptInstall } = usePWAInstall();
  const { data: isAdmin } = useIsAdmin();

  const isOnAdminRoute = currentPath.startsWith('/admin');

  const handleLockAdmin = () => {
    // Dispatch the lock event so AdminPasscodeGate reacts immediately
    window.dispatchEvent(new Event(LOCK_EVENT));
  };

  const navLinks = [
    { to: '/admin', label: 'Admin Panel', icon: LayoutDashboard },
    { to: '/faculty', label: 'Faculty Portal', icon: GraduationCap },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground shadow-elevated sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
            <img
              src="/assets/generated/eduboard-logo.dim_256x256.png"
              alt="EduBoard Logo"
              className="h-10 w-10 rounded-lg object-contain bg-primary-foreground/10 p-1"
            />
            <div>
              <h1 className="font-display text-xl font-bold leading-tight">EduBoard</h1>
              <p className="text-xs text-primary-foreground/70 leading-none">Smart Faculty Portal</p>
            </div>
          </Link>

          <nav className="flex items-center gap-2">
            {navLinks.map(({ to, label, icon: Icon }) => {
              const isActive = currentPath.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`
                    flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold
                    transition-all duration-150 touch-target
                    ${isActive
                      ? 'bg-accent text-accent-foreground shadow-xs'
                      : 'text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}

            {/* Dev Portal link — only visible to admins */}
            {isAdmin && (
              <Link
                to="/dev-portal"
                className={`
                  flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-semibold
                  transition-all duration-150 touch-target
                  ${currentPath.startsWith('/dev-portal')
                    ? 'bg-amber-500/30 text-amber-200 shadow-xs'
                    : 'text-amber-300/80 hover:bg-amber-500/20 hover:text-amber-200'
                  }
                `}
                title="Developer Portal"
              >
                <Terminal className="h-4 w-4" />
                <span className="hidden lg:inline">Dev Portal</span>
              </Link>
            )}

            {/* Lock Admin button — visible only when on the admin route */}
            {isOnAdminRoute && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLockAdmin}
                className="gap-2 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 ml-1"
                title="Lock Admin Panel"
              >
                <Lock className="h-4 w-4" />
                <span className="hidden sm:inline">Lock</span>
              </Button>
            )}

            {/* PWA Install Button */}
            {isInstallable && (
              <Button
                variant="outline"
                size="sm"
                onClick={promptInstall}
                className="gap-2 ml-1 bg-accent/10 border-accent/40 text-primary-foreground hover:bg-accent/20 hover:text-primary-foreground hidden sm:flex"
              >
                <Download className="h-4 w-4" />
                Install App
              </Button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-primary/5 border-t border-border py-4 mt-auto">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-accent" />
            <span>© {new Date().getFullYear()} EduBoard — Smart Faculty PDF Portal</span>
          </div>
          <div className="flex items-center gap-3">
            {isInstallable && (
              <button
                onClick={promptInstall}
                className="flex items-center gap-1.5 text-accent hover:underline font-medium text-xs sm:hidden"
              >
                <Download className="h-3.5 w-3.5" />
                Install App
              </button>
            )}
            <div className="flex items-center gap-1">
              <span>Built with</span>
              <span className="text-accent">♥</span>
              <span>using</span>
              <a
                href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname || 'eduboard-faculty-portal')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:underline"
              >
                caffeine.ai
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
