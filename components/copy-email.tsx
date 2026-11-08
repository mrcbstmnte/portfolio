'use client';

import { useRef, useState } from 'react';

type Status = 'idle' | 'copied' | 'selected';

const messages: Record<Status, string> = {
  idle: '',
  copied: 'copied to clipboard',
  selected: 'press ⌘/Ctrl+C to copy',
};

export function CopyEmail({ email }: { email: string }) {
  const emailRef = useRef<HTMLSpanElement>(null);
  const [status, setStatus] = useState<Status>('idle');

  async function copy() {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(email);
      setStatus('copied');
    } catch {
      // No clipboard access (insecure context, old browser, denied
      // permission): select the address so the visitor can copy it themselves.
      const node = emailRef.current;
      const selection = window.getSelection();
      if (node && selection) {
        const range = document.createRange();
        range.selectNodeContents(node);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      setStatus('selected');
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 font-mono">
      <a
        href={`mailto:${email}`}
        className="text-accent break-all underline-offset-4 hover:underline"
      >
        <span ref={emailRef}>{email}</span>
      </a>
      <button
        type="button"
        onClick={copy}
        className="border-border text-muted hover:border-accent hover:text-accent rounded border px-2 py-1 text-xs transition-colors"
      >
        copy email
      </button>
      <span role="status" aria-live="polite" className="text-muted text-xs">
        {messages[status]}
      </span>
    </div>
  );
}
