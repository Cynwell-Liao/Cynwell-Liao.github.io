export const SECTION_IDS = ['about', 'tech-stack', 'projects', 'education'] as const

export type SectionId = (typeof SECTION_IDS)[number]
export type SectionFragment = `#${SectionId}`

const sectionIdSet = new Set<string>(SECTION_IDS)

export const isSectionFragment = (value: unknown): value is SectionFragment =>
  typeof value === 'string' && value.startsWith('#') && sectionIdSet.has(value.slice(1))
