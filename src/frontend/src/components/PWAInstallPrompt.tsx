import { Download, Share, Smartphone, X } from "lucide-react";
import React, { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIOS() {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isInStandaloneMode() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in window.navigator &&
      (window.navigator as { standalone?: boolean }).standalone === true)
  );
}

const DISMISS_KEY = "pwa-install-dismissed-at";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function wasDismissedRecently(): boolean {
  const ts = localStorage.getItem(DISMISS_KEY);
  if (!ts) return false;
  return Date.now() - Number(ts) < DISMISS_DURATION_MS;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    // Already installed — don't show
    if (isInStandaloneMode()) return;

    // Dismissed recently — don't show
    if (wasDismissedRecently()) return;

    if (isIOS()) {
      // iOS: show manual instructions after a short delay
      const timer = setTimeout(() => setShowIOS(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android/Chrome/Edge: listen for native install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIOS(false);
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  };

  // iOS manual install banner
  if (showIOS) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
        <div className="bg-card border border-border rounded-xl shadow-2xl p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-5 h-5 text-accent" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                Install EduBoards
              </p>
            </div>
            <button
              type="button"
              onClick={handleDismiss}
              className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground mb-2">
            To install on this device:
          </p>
          <ol className="text-xs text-muted-foreground space-y-1 pl-3 list-decimal">
            <li>
              Tap the{" "}
              <span className="inline-flex items-center gap-0.5 text-accent font-medium">
                <Share className="w-3 h-3" /> Share
              </span>{" "}
              button in Safari
            </li>
            <li>
              Scroll down and tap{" "}
              <span className="font-medium text-foreground">
                "Add to Home Screen"
              </span>
            </li>
            <li>
              Tap <span className="font-medium text-foreground">"Add"</span> to
              confirm
            </li>
          </ol>
          <button
            type="button"
            onClick={handleDismiss}
            className="mt-3 w-full text-xs text-muted-foreground border border-border rounded-lg py-1.5 hover:bg-muted/40 transition-colors"
          >
            Not now
          </button>
        </div>
      </div>
    );
  }

  // Android/Chrome install banner
  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
      <div className="bg-card border border-border rounded-xl shadow-2xl p-4 flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
          <Smartphone className="w-5 h-5 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Install EduBoards
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Install on this device for quick access — works offline too.
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
