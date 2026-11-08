import { ImageResponse } from 'next/og';
import { profile } from '@/lib/content';

export const alt = `${profile.name} — ${profile.title}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        padding: 80,
        background: '#0a0a0a',
        color: '#e7e5e4',
      }}
    >
      <div style={{ fontSize: 32, color: '#00ff41' }}>~/marc $ whoami</div>
      <div style={{ fontSize: 76, fontWeight: 700, marginTop: 24 }}>
        {profile.name}
      </div>
      <div style={{ fontSize: 36, color: '#a8a29e', marginTop: 16 }}>
        {profile.title}
      </div>
    </div>,
    size,
  );
}
