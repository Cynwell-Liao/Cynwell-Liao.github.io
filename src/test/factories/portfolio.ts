import type {
  EducationItem,
  NavLink,
  Project,
  SkillCategory,
  SkillItem,
} from '@shared/types/portfolio.types'

export const createProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'example-project',
  title: 'Example Project',
  summary: 'A deterministic project summary.',
  highlights: ['Validated behavior', 'Accessible interface'],
  stack: ['TypeScript', 'React'],
  liveUrl: 'https://example.com/project',
  repoUrl: 'https://github.com/example/project',
  ...overrides,
})

export const createEducationItem = (
  overrides: Partial<EducationItem> = {}
): EducationItem => ({
  institution: 'Example Institute of Technology',
  location: 'Example City',
  degree: 'Master of Software Engineering',
  duration: '2022 — 2024',
  achievements: ['Graduated with distinction'],
  icon: 'graduation-cap',
  logoUrl: 'https://example.com/institute.png',
  color: '#123ABC',
  ...overrides,
})

export const createSkillItem = (overrides: Partial<SkillItem> = {}): SkillItem => ({
  name: 'TypeScript',
  note: 'Typed application development',
  icon: 'typescript',
  color: '#3178C6',
  ...overrides,
})

export const createSkillCategory = (
  overrides: Partial<SkillCategory> = {}
): SkillCategory => ({
  title: 'Languages',
  items: [createSkillItem()],
  ...overrides,
})

export const createNavLink = (overrides: Partial<NavLink> = {}): NavLink => ({
  label: 'About',
  href: '#about',
  ...overrides,
})
