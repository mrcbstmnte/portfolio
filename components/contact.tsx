import { CopyEmail } from '@/components/copy-email';
import { profile } from '@/lib/content';
import { displayUrl } from '@/lib/format';

export function Contact() {
  const links = [
    { label: 'linkedin', href: profile.links.linkedin },
    { label: 'github', href: profile.links.github },
  ];

  return (
    <div className="space-y-6">
      <p className="text-muted max-w-2xl">
        Open to senior backend and full-stack roles, remote. The fastest way to
        reach me is email.
      </p>
      <CopyEmail email={profile.email} />
      <ul className="space-y-2 font-mono text-sm">
        {links.map((link) => (
          <li key={link.label}>
            <span className="text-muted">{link.label}: </span>
            <a
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="text-accent break-all underline-offset-4 hover:underline"
            >
              {displayUrl(link.href)}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
