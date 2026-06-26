/**
 * useAdminInstall.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Gerencia a instalação do Painel Supertech como PWA.
 *
 * • Registra o service worker sw-admin.js (somente uma vez por sessão).
 * • Captura o evento beforeinstallprompt.
 * • Expõe: canInstall, isIOS, install(), isInstalled.
 *
 * REGRA: Este hook DEVE ser usado apenas em componentes dentro de /admin/*.
 *        A lógica de escopo do manifest já garante que beforeinstallprompt
 *        só dispara quando o usuário está em /admin/ — mas mantemos a
 *        verificação de rota no componente como garantia extra.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface AdminInstallState {
  /** Whether the standard PWA install prompt is available */
  canInstall: boolean;
  /** Whether the device is iOS (Safari — no beforeinstallprompt support) */
  isIOS: boolean;
  /** Whether the app appears to already be running in standalone mode */
  isInstalled: boolean;
  /** Trigger the browser's native install prompt */
  install: () => Promise<void>;
  /** Whether SW + manifest were successfully registered */
  pwaReady: boolean;
}

let swRegistered = false; // Singleton: register SW only once per page load

export function useAdminInstall(): AdminInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [pwaReady, setPwaReady] = useState(false);
  const handlerRef = useRef<((e: Event) => void) | null>(null);

  // Detect iOS (no beforeinstallprompt)
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  // Detect if already running as installed PWA
  const isInstalled =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;

  // ── Register service worker (once) ─────────────────────────────────────────
  useEffect(() => {
    if (swRegistered || !('serviceWorker' in navigator)) return;
    swRegistered = true;

    navigator.serviceWorker
      .register('/sw-admin.js', { scope: '/admin/' })
      .then(() => {
        setPwaReady(true);
      })
      .catch((err) => {
        console.warn('[AdminPWA] SW registration failed:', err);
      });
  }, []);

  // ── Inject manifest link (only when in /admin/) ────────────────────────────
  useEffect(() => {
    if (!window.location.pathname.startsWith('/admin')) return;

    // Remove any existing manifest link to avoid conflicts
    const existing = document.querySelector('link[rel="manifest"]');
    if (existing) existing.remove();

    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = '/admin-manifest.webmanifest';
    link.id = 'admin-manifest-link';
    document.head.appendChild(link);

    return () => {
      // Clean up when leaving admin routes
      document.getElementById('admin-manifest-link')?.remove();
    };
  }, []);

  // ── Capture beforeinstallprompt ────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault(); // Prevent auto-prompt from browser
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    handlerRef.current = handler;
    window.addEventListener('beforeinstallprompt', handler);

    // Clean up if already installed
    window.addEventListener('appinstalled', () => {
      setDeferredPrompt(null);
    });

    return () => {
      if (handlerRef.current) {
        window.removeEventListener('beforeinstallprompt', handlerRef.current);
      }
    };
  }, []);

  // ── Install trigger ────────────────────────────────────────────────────────
  const install = async () => {
    if (!deferredPrompt) return;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } catch (err) {
      console.warn('[AdminPWA] Install prompt failed:', err);
    }
  };

  return {
    canInstall: !!deferredPrompt && !isInstalled,
    isIOS,
    isInstalled,
    install,
    pwaReady,
  };
}
