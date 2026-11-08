import { Contact } from '@/components/contact';
import { ExperienceTimeline } from '@/components/experience-timeline';
import { Hero } from '@/components/hero';
import { ProjectCard } from '@/components/project-card';
import { Section } from '@/components/section';
import { SkillsConfig } from '@/components/skills-config';
import { experience, skills } from '@/lib/content';
import { getFeaturedProjects } from '@/lib/projects';

export default function HomePage() {
  const projects = getFeaturedProjects();

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6">
      <Hero />
      <Section
        id="experience"
        command="git log --author=marc"
        title="Experience"
      >
        <ExperienceTimeline companies={experience} />
      </Section>
      <Section id="work" command="ls ~/projects" title="Selected work">
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </Section>
      <Section id="skills" command="cat skills.yml" title="Skills">
        <SkillsConfig groups={skills} />
      </Section>
      <Section id="contact" command="ping marc" title="Contact">
        <Contact />
      </Section>
    </main>
  );
}
