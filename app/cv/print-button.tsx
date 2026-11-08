'use client';

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="border-border hover:border-fg rounded border px-3 py-1.5 text-sm transition-colors"
    >
      Download PDF
    </button>
  );
}
