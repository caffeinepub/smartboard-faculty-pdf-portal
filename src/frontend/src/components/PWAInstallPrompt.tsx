import React, { useEffect, useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user previously dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showBanner || isInstalled) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl p-4 flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
          <Smartphone className="w-5 h-5 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Install SmartBoard Portal</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Install this app on your smart board for quick access — works offline too.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={handleInstall}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-accent text-accent-foreground text-xs font-semibold rounded-lg hover:bg-accent/90 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Install App
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border rounded-lg transition-colors"
            >
              Not now
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
