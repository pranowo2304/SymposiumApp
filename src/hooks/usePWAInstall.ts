import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface Window {
    __deferredPwaPrompt?: BeforeInstallPromptEvent | null;
  }
}

// Capture beforeinstallprompt as early as module load so it is never missed
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    window.__deferredPwaPrompt = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new CustomEvent('pwa-prompt-available'));
  });
}

export type DevicePlatform = 'android' | 'ios' | 'desktop';

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    typeof window !== 'undefined' ? window.__deferredPwaPrompt || null : null
  );
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIframe, setIsIframe] = useState(false);
  const [platform, setPlatform] = useState<DevicePlatform>('desktop');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect standalone mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // Detect iframe
    try {
      setIsIframe(window.self !== window.top);
    } catch {
      setIsIframe(true);
    }

    // Detect device platform
    const ua = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) {
      setPlatform('ios');
    } else if (/android/.test(ua)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    if (window.__deferredPwaPrompt) {
      setDeferredPrompt(window.__deferredPwaPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__deferredPwaPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handlePromptAvailable = () => {
      if (window.__deferredPwaPrompt) {
        setDeferredPrompt(window.__deferredPwaPrompt);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      window.__deferredPwaPrompt = null;
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-available', handlePromptAvailable);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-available', handlePromptAvailable);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = useCallback(async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    const promptToUse = deferredPrompt || window.__deferredPwaPrompt;
    if (!promptToUse) return 'unavailable';

    try {
      await promptToUse.prompt();
      const { outcome } = await promptToUse.userChoice;
      if (outcome === 'accepted') {
        window.__deferredPwaPrompt = null;
        setDeferredPrompt(null);
      }
      return outcome;
    } catch {
      return 'unavailable';
    }
  }, [deferredPrompt]);

  return {
    isInstallable: !!deferredPrompt && !isInstalled,
    isInstalled,
    isIframe,
    platform,
    installApp,
  };
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
