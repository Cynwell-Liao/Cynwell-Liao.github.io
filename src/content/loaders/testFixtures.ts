export const createValidEducation = () => [
  {
    institution: 'Example Institute of Technology',
    location: 'Example City',
    degree: 'Master of Software Engineering',
    duration: '2022 — 2024',
    achievements: ['Graduated with distinction'],
    icon: 'graduation-cap',
    logoUrl: 'https://example.com/institute.png',
    color: '#123ABC',
  },
]

export const createValidProjects = () => [
  {
    id: 'example-project',
    title: 'Example Project',
    summary: 'A deterministic project fixture.',
    highlights: ['Validated at runtime'],
    stack: ['TypeScript'],
    repoUrl: 'https://github.com/example/example-project',
    liveUrl: 'https://example.com/example-project',
  },
]

export const createValidSkills = () => [
  {
    title: 'Languages',
    items: [
      {
        name: 'TypeScript',
        note: 'Typed application development',
        icon: 'typescript',
        color: '#3178C6',
      },
    ],
  },
]

export const createValidRawProfile = () => ({
  name: 'Example Engineer',
  brandName: 'example-engineer',
  title: 'Software Engineer',
  tagline: 'Building reliable systems',
  githubUsername: 'example-engineer',
  githubUrl: 'https://github.com/example-engineer',
  repositoryUrl: 'https://github.com/example-engineer/portfolio',
  linkedinUrl: 'https://www.linkedin.com/in/example-engineer',
  linkedinConnectionCount: 250,
  about: {
    headingLead: 'Engineering',
    headingAccent: 'with intent.',
    intro: 'I build reliable products.',
    paragraphs: ['I value clear contracts.', 'I test observable behavior.'],
  },
  hero: {
    statusLabel: 'SYSTEMS ONLINE',
    terminalPath: '~/example',
    terminalDirectories: ['projects', 'skills'],
    terminalPrompt: '_',
    certificationsHeading: 'Certifications',
  },
  certifications: [
    {
      credentialUrl: 'https://example.com/credential',
      imageUrl: 'https://example.com/badge.png',
      imageAlt: 'Example certification badge',
      imageWidth: 100,
      imageHeight: 100,
    },
  ],
  navLinks: [
    { label: 'About', href: '#about' },
    { label: 'Projects', href: '#projects' },
  ],
  labels: {
    githubLabel: 'GitHub',
    linkedinLabel: 'LinkedIn',
    linkedinConnectionsLabel: 'connections',
    contributionsLoadingLabel: 'Loading contributions...',
    contributionsSuffixLabel: 'contributions this year',
    techStackSectionEyebrow: 'Tools',
    techStackSectionTitle: 'Technology stack',
    techStackSectionDescription: 'Tools used to build reliable systems.',
    projectsSectionEyebrow: 'Work',
    projectsSectionTitle: 'Projects',
    projectsSectionDescription: 'Selected example projects.',
    projectLiveLabel: 'View live',
    projectSourceLabel: 'View source',
    educationSectionEyebrow: 'Learning',
    educationSectionTitle: 'Education',
    educationSectionDescription: 'A history of continuous learning.',
    footerAttribution: 'Built for deterministic tests.',
  },
})
