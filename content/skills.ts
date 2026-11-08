import type { SkillGroup } from '@/lib/schemas';

export const skills = [
  {
    label: 'Languages & Runtimes',
    items: ['Ruby', 'Node.js', 'JavaScript', 'PHP'],
  },
  {
    label: 'Frameworks & Libraries',
    items: ['Ruby on Rails', 'Vue.js', 'React.js', 'Next.js'],
  },
  {
    label: 'Data & Storage',
    items: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch'],
  },
  {
    label: 'Infrastructure & Messaging',
    items: ['AWS', 'Google Cloud Services', 'Kafka'],
  },
  {
    label: 'Testing',
    items: ['RSpec', 'Jest', 'Vitest', 'Playwright'],
  },
  {
    label: 'DevOps & Tooling',
    items: ['Git', 'GitHub Actions (CI/CD)', 'Docker'],
  },
  {
    label: 'Engineering Practices',
    items: [
      'RESTful API Design',
      'Microservices Architecture',
      'TDD/BDD',
      'Performance Optimization',
      'Code Reviews',
    ],
  },
  {
    label: 'AI-Assisted Development',
    items: ['Claude', 'Generative AI tooling'],
  },
] satisfies SkillGroup[];
