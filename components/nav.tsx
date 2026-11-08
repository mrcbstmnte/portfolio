import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

const sections = ['experience', 'work', 'skills', 'contact'];

export function Nav() {
  return (
    <header className="border-border bg-bg/80 sticky top-0 z-10 border-b backdrop-blur print:hidden">
      <nav className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 font-mono text-sm sm:px-6">
        <Link href="/" className="text-accent font-semibold">
          ~/marc
        </Link>
        <div className="flex items-center gap-4">
          <ul className="hidden items-center gap-4 sm:flex">
            {sections.map((section) => (
              <li key={section}>
                <Link
                  href={`/#${section}`}
                  className="text-muted hover:text-accent transition-colors"
                >
                  {section}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/cv"
            className="text-muted hover:text-accent transition-colors"
          >
            cv
          </Link>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
