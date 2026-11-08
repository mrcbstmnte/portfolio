import Image from 'next/image';
import type { Screenshot } from '@/lib/schemas';

export function ScreenshotGallery({
  screenshots,
}: {
  screenshots: Screenshot[];
}) {
  if (screenshots.length === 0) return null;

  return (
    <div className="not-prose my-10 grid gap-6 sm:grid-cols-2">
      {screenshots.map((shot, index) => (
        <figure
          key={shot.src}
          className={index === 0 ? 'sm:col-span-2' : undefined}
        >
          {/* Opens the full-size image in a new tab. */}
          <a
            href={shot.src}
            target="_blank"
            rel="noreferrer"
            className="border-border bg-surface hover:border-accent block overflow-hidden rounded-lg border transition-colors"
          >
            <Image
              src={shot.src}
              alt={shot.alt}
              width={shot.width}
              height={shot.height}
              sizes={
                index === 0
                  ? '(min-width: 768px) 70ch, 100vw'
                  : '(min-width: 640px) 35ch, 100vw'
              }
              preload={index === 0}
              className="h-auto w-full"
            />
          </a>
          <figcaption className="text-muted mt-2 text-sm">
            {shot.caption}
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
