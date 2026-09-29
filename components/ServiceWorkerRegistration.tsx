'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // Installability is a progressive enhancement — a failed registration
        // (unsupported browser, blocked by an extension) shouldn't break the app.
      });
    }
  }, []);

  return null;
}
