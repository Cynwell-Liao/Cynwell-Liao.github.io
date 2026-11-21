import { describe, expect, it } from 'vitest'

import { parseSkills, skillCategories } from './loadSkills'
import { createValidSkills } from './testFixtures'

describe('skills content', () => {
  it('exports a validated readonly skill collection', () => {
    expect(skillCategories.length).toBeGreaterThan(0)
  })

  it('uses the requested category names and observability tools', () => {
    expect(skillCategories.map((category) => category.title)).toEqual([
      'Languages',
      'AI',
      'Cloud',
      'Databases',
      'Frameworks',
      'Observability',
    ])

    const observability = skillCategories.find(
      (category) => category.title === 'Observability'
    )
    expect(observability?.items.map(({ name, note }) => ({ name, note }))).toEqual([
      { name: 'LangSmith', note: 'LLM tracing & evaluation' },
      { name: 'OpenTelemetry', note: 'Tracing & instrumentation' },
      { name: 'Prometheus', note: 'Metrics collection & alerts' },
      { name: 'Grafana', note: 'Dashboards & visualisation' },
      { name: 'Splunk', note: 'Log analytics & security' },
    ])
    expect(observability?.items.map((item) => item.name)).not.toContain('Pytest')
    expect(observability?.items.map((item) => item.name)).not.toContain('Go test')

    const framework = skillCategories.find(
      (category) => category.title === 'Frameworks'
    )
    expect(framework?.items.map((item) => item.name)).toContain('Temporal')
    expect(framework?.items.map((item) => item.name)).toContain('Next.js')

    const ai = skillCategories.find((category) => category.title === 'AI')
    expect(ai?.items.map((item) => item.name)).toEqual([
      'LangChain',
      'Ollama',
      'GPT',
      'Claude',
      'Gemini',
    ])

    const cloud = skillCategories.find((category) => category.title === 'Cloud')
    expect(cloud?.items.map((item) => item.name)).toContain('Argo CD')
    expect(cloud?.items.slice(0, 2).map((item) => item.name)).toEqual([
      'AWS',
      'Google Cloud',
    ])
    const databases = skillCategories.find((category) => category.title === 'Databases')
    expect(databases?.items.slice(0, 2).map((item) => item.name)).toEqual([
      'PostgreSQL',
      'MySQL',
    ])
  })

  it('parses a valid skill fixture', () => {
    expect(parseSkills(createValidSkills())).toEqual(createValidSkills())
  })

  it.each([
    ['an empty collection', []],
    ['an empty category', [{ ...createValidSkills()[0], items: [] }]],
    [
      'an unknown icon',
      [
        {
          ...createValidSkills()[0],
          items: [{ ...createValidSkills()[0].items[0], icon: 'unknown-icon' }],
        },
      ],
    ],
    [
      'an invalid color',
      [
        {
          ...createValidSkills()[0],
          items: [{ ...createValidSkills()[0].items[0], color: '#1234' }],
        },
      ],
    ],
    [
      'an unknown item property',
      [
        {
          ...createValidSkills()[0],
          items: [{ ...createValidSkills()[0].items[0], unexpected: true }],
        },
      ],
    ],
    ['an unknown category property', [{ ...createValidSkills()[0], unexpected: true }]],
  ])('rejects %s', (_description, input) => {
    expect(() => parseSkills(input)).toThrow(/Invalid content\/data\/skills\.json/)
  })

  it('rejects category titles that differ only by case', () => {
    const category = createValidSkills()[0]

    expect(() =>
      parseSkills([
        category,
        { ...category, title: category.title.toLocaleUpperCase('en-US') },
      ])
    ).toThrow(/Skill category titles must be unique \(case-insensitive\)/)
  })

  it('rejects skill names that differ only by case within a category', () => {
    const category = createValidSkills()[0]
    const item = category.items[0]

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
