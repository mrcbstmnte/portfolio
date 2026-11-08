'use client';

import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // false during SSR and hydration, true afterwards — avoids a theme-label mismatch.
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const isDark = resolvedTheme === 'dark';
  const label = mounted ? `theme: ${isDark ? 'dark' : 'light'}` : 'theme: …';

  return (
    <button
      type="button"
      aria-label={`${label}, toggle colour theme`}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="border-border text-muted hover:border-accent hover:text-accent rounded border px-2 py-1 font-mono text-xs transition-colors"
    >
      {label}
    </button>
  );
}
