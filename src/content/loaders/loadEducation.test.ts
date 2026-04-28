import { describe, expect, it } from 'vitest'

import { loadEducation, parseEducation } from './loadEducation'

describe('loadEducation', () => {
  it('returns parsed education items from JSON', () => {
    const education = loadEducation()

    expect(education.length).toBeGreaterThan(0)
    expect(education[0]).toEqual(
      expect.objectContaining({
        institution: expect.any(String),
        degree: expect.any(String),
        duration: expect.any(String),
        achievements: expect.any(Array),
      })
    )
  })
})

describe('parseEducation', () => {
  it('parses valid education input', () => {
    const parsed = parseEducation([
      {
        institution: 'MIT',
        degree: 'Computer Science',
        duration: '2020 — 2024',
        achievements: ['Dean\u2019s List'],
        icon: 'graduation-cap',
        logoUrl: 'https://example.com/logo.png',
        color: '#A31F34',
      },
    ])

    expect(parsed).toEqual([
      {
        institution: 'MIT',
        degree: 'Computer Science',
        duration: '2020 — 2024',
        achievements: ['Dean\u2019s List'],
        icon: 'graduation-cap',
        logoUrl: 'https://example.com/logo.png',
        color: '#A31F34',
      },
    ])
  })

  it('throws a descriptive error for invalid education input', () => {
    expect(() =>
      parseEducation([
        {
          institution: '',
          degree: '',
          duration: '',
          achievements: [],
        },
      ])
    ).toThrow(/Invalid content\/data\/education\.json/)
  })
})
