import type { ReactNode } from 'react';

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="border-border text-muted rounded border px-2 py-0.5 font-mono text-xs break-words">
      {children}
    </span>
  );
}
