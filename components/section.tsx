import type { ReactNode } from 'react';

type Props = {
  id: string;
  command: string;
  title: string;
  children: ReactNode;
};

export function Section({ id, command, title, children }: Props) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="reveal border-border scroll-mt-20 border-t py-16"
    >
      <p className="text-muted font-mono text-sm">
        <span className="text-accent">$</span> {command}
      </p>
      <h2
        id={`${id}-heading`}
        className="text-accent mt-2 font-mono text-2xl font-semibold"
      >
        {title}
      </h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}
