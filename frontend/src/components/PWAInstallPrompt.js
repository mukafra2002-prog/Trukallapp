import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone, Zap, WifiOff, Bell } from 'lucide-react';

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently (don't show for 7 days)
    const dismissed = localStorage.getItem('pwa_prompt_dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) return;
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(isIOSDevice);

    // Listen for beforeinstallprompt (Android/Desktop)
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt after 30 seconds of browsing
      setTimeout(() => setShowPrompt(true), 30000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // For iOS, show after 30 seconds
    if (isIOSDevice) {
      setTimeout(() => setShowPrompt(true), 30000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa_prompt_dismissed', new Date().toISOString());
    setShowPrompt(false);
  };

  if (!showPrompt || isInstalled) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <div className="max-w-lg mx-auto bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-white/70 hover:text-white"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-3xl">🚛</span>
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Install TrukAll</h3>
              <p className="text-white/80 text-sm">Add to your home screen</p>
            </div>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div className="bg-white/10 rounded-lg p-2 text-center">
              <Zap className="w-5 h-5 text-yellow-300 mx-auto mb-1" />
              <span className="text-white text-xs">Faster</span>
            </div>
            <div className="bg-white/10 rounded-lg p-2 text-center">
              <WifiOff className="w-5 h-5 text-green-300 mx-auto mb-1" />
              <span className="text-white text-xs">Offline</span>
            </div>
            <div className="bg-white/10 rounded-lg p-2 text-center">
              <Bell className="w-5 h-5 text-purple-300 mx-auto mb-1" />
              <span className="text-white text-xs">Alerts</span>
            </div>
          </div>

          {/* Install Instructions */}
          {isIOS ? (
            <div className="bg-white/10 rounded-lg p-4 mb-4">
              <p className="text-white text-sm mb-2">
                <strong>To install on iPhone/iPad:</strong>
              </p>
              <ol className="text-white/90 text-sm space-y-1">
                <li>1. Tap the <strong>Share</strong> button <span className="inline-block w-5 h-5 bg-white/20 rounded text-center">↑</span></li>
                <li>2. Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                <li>3. Tap <strong>"Add"</strong> in the top right</li>
              </ol>
            </div>
          ) : (
            <Button
              onClick={handleInstall}
              className="w-full bg-white text-blue-600 hover:bg-gray-100 font-bold py-6 text-lg"
              data-testid="pwa-install-btn"
            >
              <Download className="w-5 h-5 mr-2" />
              Install Now - It's Free!
            </Button>
          )}

          {/* Skip link */}
          <button
            onClick={handleDismiss}
            className="w-full text-white/70 text-sm mt-3 hover:text-white"
          >
            Maybe later
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}
