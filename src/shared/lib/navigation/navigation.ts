export const SECTION_ID = {
  home: 'home',
  about: 'about',
  techStack: 'tech-stack',
  projects: 'projects',
  education: 'education',
} as const

export const SECTION_IDS = [
  SECTION_ID.about,
  SECTION_ID.techStack,
  SECTION_ID.projects,
  SECTION_ID.education,
] as const

export type SectionId = (typeof SECTION_IDS)[number]
export type SectionFragment = `#${SectionId}`

const sectionIdSet = new Set<string>(SECTION_IDS)

export const isSectionFragment = (value: unknown): value is SectionFragment =>
  typeof value === 'string' && value.startsWith('#') && sectionIdSet.has(value.slice(1))
