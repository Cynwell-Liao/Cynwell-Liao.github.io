import { describe, expect, it } from 'vitest'

import { loadSkills, parseSkills } from './loadSkills'

describe('loadSkills', () => {
  it('returns parsed skill categories from JSON', () => {
    const skills = loadSkills()

    expect(skills.length).toBeGreaterThan(0)
    expect(skills[0]).toEqual(
      expect.objectContaining({
        title: expect.any(String),
        items: expect.any(Array),
      })
    )
    expect(skills[0].items[0]).toEqual(
      expect.objectContaining({
        name: expect.any(String),
        note: expect.any(String),
        icon: expect.any(String),
      })
    )
  })
})

describe('parseSkills', () => {
  it('parses valid skill input', () => {
    const parsed = parseSkills([
      {
        title: 'Languages',
        items: [
          {
            name: 'TypeScript',
            note: 'Typed JS',
            icon: 'typescript',
            color: '#3178C6',
          },
        ],
      },
    ])

    expect(parsed).toEqual([
      {
        title: 'Languages',
        items: [
          {
            name: 'TypeScript',
            note: 'Typed JS',
            icon: 'typescript',
            color: '#3178C6',
          },
        ],
      },
    ])
  })

  it('throws a descriptive error for invalid skill input', () => {
    expect(() =>
      parseSkills([
        {
          title: '',
          items: [],
        },
      ])
    ).toThrow(/Invalid content\/data\/skills\.json/)
  })
})
