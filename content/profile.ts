import type { Profile } from '@/lib/schemas';

export const profile = {
  name: 'Marc Alain Bustamante',
  title: 'Senior Software Engineer · Backend & Full Stack',
  tagline:
    '9+ years building reliable production systems across fintech, e-commerce and high-traffic chat infrastructure — mostly in Ruby on Rails and Node.js.',
  summary:
    "Senior Software Engineer with 9+ years building and hardening full-stack production systems across fintech, travel technology, and high-traffic chat infrastructure — industries where reliability, security, and correctness aren't optional. Comfortable end-to-end, from customer-facing front-end flows to backend architecture, with Ruby on Rails and Node.js as primary tools. Deep experience in payment infrastructure, e-commerce platforms, distributed systems, technical architecture, and legacy system modernization. Applies TDD/CI-CD rigor throughout the development lifecycle and uses AI-assisted development tools daily to accelerate delivery.",
  location: 'Bacolod City, Philippines',
  yearsOfExperience: 9,
  email: 'mrcbstmnte@gmail.com',
  links: {
    github: 'https://github.com/mrcbstmnte',
    linkedin: 'https://www.linkedin.com/in/mrcbstmnte',
  },
} satisfies Profile;
