import { describe, expect, it } from 'vitest'

import { SECTION_IDS, isSectionFragment } from './navigation'

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
})
