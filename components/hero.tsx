import Link from 'next/link';
import { profile } from '@/lib/content';

export function Hero() {
  return (
    <section className="pt-20 pb-16 sm:pt-28">
      <p className="text-muted font-mono text-sm">
        <span className="text-accent">~/marc</span> $ whoami
        <span aria-hidden="true" className="cursor-blink text-accent ml-1">
          ▍
        </span>
      </p>
      <h1 className="text-accent mt-4 font-mono text-4xl font-bold tracking-tight sm:text-5xl">
        {profile.name}
      </h1>
      <p className="text-fg mt-3 font-mono text-lg">{profile.title}</p>
      <p className="text-muted mt-6 max-w-2xl text-lg">{profile.tagline}</p>
      <ul className="text-muted mt-6 flex flex-wrap gap-2 font-mono text-xs">
        <li className="border-border rounded border px-2 py-1">
          Remote · {profile.location}
        </li>
        <li className="border-border rounded border px-2 py-1">
          {profile.yearsOfExperience}+ yrs
        </li>
      </ul>
      <div className="mt-8 flex flex-wrap gap-3 font-mono text-sm">
        <Link
          href="/cv"
          className="bg-accent text-bg rounded px-4 py-2 font-semibold transition-opacity hover:opacity-90"
        >
          View CV
        </Link>
        <a
          href={`mailto:${profile.email}`}
          className="border-border hover:border-accent hover:text-accent rounded border px-4 py-2 transition-colors"
        >
          Email me
        </a>
      </div>
    </section>
  );
}
