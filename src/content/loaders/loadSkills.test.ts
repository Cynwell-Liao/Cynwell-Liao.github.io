import { describe, expect, it } from 'vitest'

import { getRequired } from '../../test/getRequired'

import { parseSkills, skillCategories } from './loadSkills'
import { createValidSkills } from './testFixtures'

const firstCategory = () => getRequired(createValidSkills(), 0, 'skill category')
const firstSkill = () => getRequired(firstCategory().items, 0, 'skill item')

describe('skills content', () => {
  it('exports a validated readonly skill collection', () => {
    expect(skillCategories.length).toBeGreaterThan(0)
  })

  it('parses a valid skill fixture', () => {
    expect(parseSkills(createValidSkills())).toEqual(createValidSkills())
  })

  it.each([
    ['an empty collection', []],
    ['an empty category', [{ ...firstCategory(), items: [] }]],
    [
      'an unknown icon',
      [
        {
          ...firstCategory(),
          items: [{ ...firstSkill(), icon: 'unknown-icon' }],
        },
      ],
    ],
    [
      'an invalid color',
      [
        {
          ...firstCategory(),
          items: [{ ...firstSkill(), color: '#1234' }],
        },
      ],
    ],
    [
      'an unknown item property',
      [
        {
          ...firstCategory(),
          items: [{ ...firstSkill(), unexpected: true }],
        },
      ],
    ],
    ['an unknown category property', [{ ...firstCategory(), unexpected: true }]],
  ])('rejects %s', (_description, input) => {
    expect(() => parseSkills(input)).toThrow(/Invalid content\/data\/skills\.json/)
  })

  it('rejects category titles that differ only by case', () => {
    const category = firstCategory()

    expect(() =>
      parseSkills([
        category,
        { ...category, title: category.title.toLocaleUpperCase('en-US') },
      ])
    ).toThrow(/Skill category titles must be unique \(case-insensitive\)/)
  })

  it('rejects skill names that differ only by case within a category', () => {
    const category = firstCategory()
    const item = getRequired(category.items, 0, 'skill item')

    expect(() =>
      parseSkills([
        {
          ...category,
          items: [item, { ...item, name: item.name.toLocaleUpperCase('en-US') }],
        },
      ])
    ).toThrow(/Skill names must be unique within a category \(case-insensitive\)/)
  })
})
