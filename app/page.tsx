import { profile } from '@/lib/content';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-24 sm:px-6">
      <h1 className="font-mono text-4xl font-bold">{profile.name}</h1>
    </main>
  );
}
