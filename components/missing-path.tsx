'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

// The 404 page is prerendered once, so the real path is only known in the
// browser. The empty server snapshot keeps hydration consistent.
export function MissingPath() {
  return useSyncExternalStore(
    subscribe,
    () => window.location.pathname,
    () => '',
  );
}
