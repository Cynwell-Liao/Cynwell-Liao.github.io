import { describe, expect, it } from 'vitest'

import { education, parseEducation } from './loadEducation'
import { createValidEducation } from './testFixtures'

describe('education content', () => {
  it('exports a validated readonly education collection', () => {
    expect(education.length).toBeGreaterThan(0)
  })

  it('parses a valid education fixture', () => {
    expect(parseEducation(createValidEducation())).toEqual(createValidEducation())
  })

  it.each([
    ['an empty collection', []],
    ['empty achievements', [{ ...createValidEducation()[0], achievements: [] }]],
    [
      'a whitespace-only institution',
      [{ ...createValidEducation()[0], institution: '   ' }],
    ],
    [
      'a non-HTTPS logo',
      [{ ...createValidEducation()[0], logoUrl: 'http://example.com/logo.png' }],
    ],
    ['an unknown icon', [{ ...createValidEducation()[0], icon: 'unknown-icon' }]],
    ['an invalid color', [{ ...createValidEducation()[0], color: 'blue' }]],
    ['an unknown property', [{ ...createValidEducation()[0], unexpected: true }]],
  ])('rejects %s', (_description, input) => {
    expect(() => parseEducation(input)).toThrow(
      /Invalid content\/data\/education\.json/
    )
  })

  it('rejects institution names that differ only by case', () => {
    const item = createValidEducation()[0]

    expect(() =>
      parseEducation([
        item,
        {
          ...item,
          institution: item.institution.toLocaleUpperCase('en-US'),
        },
      ])
    ).toThrow(/Education institutions must be unique \(case-insensitive\)/)
  })
})
