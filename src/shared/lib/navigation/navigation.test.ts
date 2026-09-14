import { describe, expect, it } from 'vitest'

import { SECTION_ID, SECTION_IDS, isSectionFragment } from './navigation'

describe('portfolio navigation metadata', () => {
  it('recognizes every canonical section fragment', () => {
    SECTION_IDS.forEach((sectionId) => {
      expect(isSectionFragment(`#${sectionId}`)).toBe(true)
    })
  })

  it('rejects malformed, unknown, and non-string fragments', () => {
    expect(isSectionFragment('about')).toBe(false)
    expect(isSectionFragment('#unknown')).toBe(false)
    expect(isSectionFragment(null)).toBe(false)
  })

  it('keeps the home anchor separate from configurable section links', () => {
    expect(SECTION_ID.home).toBe('home')
    expect(isSectionFragment(`#${SECTION_ID.home}`)).toBe(false)
    expect(SECTION_IDS).toEqual(['about', 'tech-stack', 'projects', 'education'])
    expect(new Set(Object.values(SECTION_ID)).size).toBe(5)
  })
})
