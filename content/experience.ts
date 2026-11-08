import type { Company } from '@/lib/schemas';

// Newest first. Within a company, roles are newest first; several roles at one
// company render as a promotion.
export const experience = [
  {
    name: 'Montani International Inc.',
    url: 'https://valore.com',
    location: 'Remote',
    tech: ['Ruby on Rails', 'PostgreSQL'],
    roles: [
      {
        title: 'Full-Stack Ruby on Rails Developer',
        start: '2023-07',
        end: '2026-10',
        highlights: [
          'Built and maintained Valore (valore.com), a multi-storefront, white-label e-commerce platform supporting an unlimited number of branded storefronts from a single shared codebase, cutting the time to launch a new storefront to days rather than weeks.',
          'Worked as one of 3 engineers who built the platform from the ground up, taking it from concept to production and supporting live e-commerce operations for new and used books.',
          "Led migration of the platform's payment gateway from a legacy third-party implementation to an internally integrated solution, improving maintainability and reducing production incidents.",
          'Developed core customer-facing flows — customizable storefront pages, transactional email templates, sign-up, checkout, and order confirmation — directly improving conversion and reducing support tickets tied to a confusing legacy flow.',
          'Applied TDD, CI/CD (GitHub Actions), and Git-based workflows throughout the development lifecycle to keep releases fast and reliable.',
          'Used Claude and other AI-assisted development tools daily for coding, debugging, technical research, and documentation, measurably speeding up delivery.',
        ],
      },
    ],
  },
  {
    name: 'PayMongo Philippines Inc.',
    url: 'https://paymongo.com',
    location: 'Remote',
    tech: ['Ruby on Rails', 'React.js'],
    roles: [
      {
        title: 'Senior Software Engineer (Interim Technical Lead)',
        start: '2023-01',
        end: '2023-07',
        highlights: [
          'Acted as Interim Technical Lead, leading technical design and architecture decisions for Direct Online Banking (DOB) payment infrastructure supporting ~₱10 million in monthly payment volume.',
          "Spearheaded the initial implementation of QR Ph payment processing, expanding the company's supported payment rails.",
          'Built and maintained payment services processing online banking transactions through major Philippine banks, including BPI and UnionBank.',
          'Partnered with engineers, product managers, and stakeholders to design and ship payment features from architecture through launch.',
          'Ran code reviews and set testing standards that raised code quality and maintainability across the team.',
        ],
      },
      {
        title: 'Software Engineer II',
        start: '2022-02',
        end: '2023-01',
        highlights: [
          'Developed and maintained Direct Online Banking (DOB) payment services powering transactions through Philippine banks.',
          "Built integrations with BPI and UnionBank as part of the company's core online banking payment infrastructure.",
          'Mentored junior software engineers on best practices, clean code, and rigorous code review standards.',
          'Improved reliability of backend services supporting a high-volume, business-critical payment path.',
          'Translated product requirements into technical implementations in close collaboration with cross-functional teams.',
        ],
      },
    ],
  },
  {
    name: 'Rakuten Travel Xchange',
    url: 'https://solutions.travel.rakuten.com',
    location: 'Remote',
    tech: ['Node.js'],
    roles: [
      {
        title: 'Full-Stack Node.js Developer',
        start: '2021-04',
        end: '2022-02',
        highlights: [
          'Developed and maintained backend services for a travel booking platform supporting property search and reservations in Japan, including accommodation bookings, experiences, and tours.',
          'Reduced technical debt by raising test coverage from near-zero to 95% on every file touched during development, cutting regressions in a legacy codebase.',
          'Enforced rigorous code review standards — going beyond rubber-stamping to actively raise coding standards across the team.',
          'Partnered with project leads and stakeholders to plan and implement product enhancements.',
        ],
      },
    ],
  },
  {
    name: 'tawk.to',
    url: 'https://www.tawk.to',
    location: 'Remote',
    tech: ['Node.js', 'Apache Kafka', 'MongoDB', 'Elasticsearch'],
    roles: [
      {
        title: 'Back-end Node.js Developer',
        start: '2019-05',
        end: '2021-03',
        highlights: [
          'Helped build a Knowledgebase service and Contacts CRM from scratch as part of a small team with the CTO — both still active in production today, serving the #1 most-used live chat application in the world.',
          'Designed and built an event-driven service on Apache Kafka, decoupling core workflows and enabling reliable communication between distributed services.',
          'Built a real-time data pipeline combining MongoDB Change Streams with Kafka, streaming data changes to downstream services with minimal latency.',
          'Maintained 100% test coverage across owned services, keeping regressions out of a platform relied on by millions of websites.',
          'Implemented Elasticsearch-powered search and filtering, and contributed to architecture discussions within a 4–5 person engineering team.',
        ],
      },
    ],
  },
  {
    name: 'SplitDragon',
    location: 'Remote',
    tech: ['Ruby on Rails'],
    roles: [
      {
        title: 'Full-Stack Ruby on Rails Developer',
        start: '2018-12',
        end: '2019-07',
        highlights: [
          "Maintained and developed the company's online marketplace platform for sellers.",
          'Led front-end development, building customer-facing landing pages that showcased products and services to drive sales.',
          'Contributed to technical decisions and development planning for the platform.',
        ],
      },
    ],
  },
  {
    name: 'Akubo Software Philippines Inc.',
    location: 'On-site',
    tech: ['Ruby on Rails'],
    roles: [
      {
        title: 'Software Engineer',
        start: '2017-03',
        end: '2019-05',
        highlights: [
          'Built a payroll system implementing Philippine-specific payroll requirements, deductions, and employee benefits across three client companies with differing business rules.',
          'Developed and maintained a Ruby on Rails HR management application for small and medium-sized businesses.',
          'Took on technical leadership responsibilities, guiding decisions and development efforts for the team.',
          'Partnered with clients and internal stakeholders on requirements analysis and development planning.',
        ],
      },
    ],
  },
] satisfies Company[];
