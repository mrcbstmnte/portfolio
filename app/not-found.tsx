import Link from 'next/link';
import { MissingPath } from '@/components/missing-path';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-4xl flex-col justify-center px-4 font-mono sm:px-6">
      <p className="text-muted text-sm">
        <span className="text-accent">~/marc</span> $ <MissingPath />
      </p>
      <h1 className="mt-4 text-2xl font-semibold">
        command not found: <MissingPath />
      </h1>
      <p className="text-muted mt-6 text-sm">
        Try{' '}
        <Link href="/" className="text-accent hover:underline">
          cd ~
        </Link>
      </p>
    </main>
  );
}
