import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { education, experience, profile, skills } from '@/lib/content';
import { displayUrl, formatRange } from '@/lib/format';
import { PrintButton } from './print-button';

export const metadata: Metadata = {
  title: 'CV',
  description: `CV of ${profile.name}, ${profile.title}.`,
  alternates: { canonical: '/cv' },
};

function CvSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="border-fg break-after-avoid border-b pb-1 text-sm font-bold tracking-wider uppercase">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function CvPage() {
  const contacts = [
    { label: profile.email, href: `mailto:${profile.email}` },
    { label: displayUrl(profile.links.linkedin), href: profile.links.linkedin },
    { label: displayUrl(profile.links.github), href: profile.links.github },
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 print:max-w-none print:p-0">
      <div className="mb-8 flex justify-end print:hidden">
        <PrintButton />
      </div>

      <article className="font-sans text-[15px] leading-relaxed print:text-[11pt]">
        <header className="text-center">
          <h1 className="text-3xl font-bold">{profile.name}</h1>
          <p className="text-muted mt-1">{profile.title}</p>
          <p className="text-muted mt-2 text-sm">{profile.location} · Remote</p>
          <p className="mt-1 flex flex-wrap justify-center gap-x-3 text-sm">
            {contacts.map((contact) => (
              <a
                key={contact.href}
                href={contact.href}
                className="inline-block py-1 break-all underline-offset-2 hover:underline"
              >
                {contact.label}
              </a>
            ))}
          </p>
        </header>

        <CvSection title="Summary">
          <p>{profile.summary}</p>
        </CvSection>

        <CvSection title="Skills">
          <ul className="space-y-1">
            {skills.map((group) => (
              <li key={group.label}>
                <strong>{group.label}:</strong> {group.items.join(', ')}
              </li>
            ))}
          </ul>
        </CvSection>

        <CvSection title="Experience">
          <div className="space-y-5">
            {experience.flatMap((company) =>
              company.roles.map((role) => (
                <div key={`${company.name}-${role.start}`}>
                  <h3 className="break-after-avoid">
                    <strong>{role.title}</strong>{' '}
                    <span className="text-muted text-sm whitespace-nowrap">
                      | {formatRange(role.start, role.end)}
                    </span>
                  </h3>
                  <p className="text-muted break-after-avoid text-sm italic">
                    {company.name} | {company.location}
                    {company.url && (
                      <>
                        {' | '}
                        <a
                          href={company.url}
                          className="underline-offset-2 hover:underline"
                        >
                          {displayUrl(company.url)}
                        </a>
                      </>
                    )}
                  </p>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {role.highlights.map((highlight) => (
                      <li key={highlight} className="break-inside-avoid">
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              )),
            )}
          </div>
        </CvSection>

        <CvSection title="Education">
          {education.map((entry) => (
            <div key={entry.degree}>
              <p>
                <strong>{entry.degree}</strong>{' '}
                <span className="text-muted text-sm">
                  | {entry.start} – {entry.end}
                </span>
              </p>
              <p className="text-muted text-sm italic">{entry.school}</p>
            </div>
          ))}
        </CvSection>
      </article>
    </main>
  );
}
