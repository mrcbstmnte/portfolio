import { ImageResponse } from 'next/og';
import { profile } from '@/lib/content';
import { getAllProjects, getProject } from '@/lib/projects';

export const alt = 'Case study';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export function generateStaticParams() {
  return getAllProjects().map((project) => ({ slug: project.slug }));
}

export default async function ProjectOpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  const title = project?.title ?? 'Case study';
  const badge = project?.type === 'public' ? '[public]' : '[NDA]';

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
        height: '100%',
        padding: 80,
        background: '#0a0a0a',
        color: '#e7e5e4',
      }}
    >
      <div style={{ fontSize: 28, color: '#4ade80' }}>
        {`~/marc/projects $ cat ${slug}.mdx`}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: 28, color: '#a8a29e' }}>{badge}</div>
        <div style={{ fontSize: 64, fontWeight: 700, marginTop: 16 }}>
          {title}
        </div>
      </div>
      <div style={{ fontSize: 28, color: '#a8a29e' }}>{profile.name}</div>
    </div>,
    size,
  );
}
