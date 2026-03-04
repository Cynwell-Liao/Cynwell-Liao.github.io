import { describe, expect, it } from 'vitest'

import { loadProjects, parseProjects } from './loadProjects'

describe('loadProjects', () => {
  it('returns parsed project content from JSON', () => {
    const projects = loadProjects()

    expect(projects.length).toBeGreaterThan(0)
    expect(projects[0]).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        title: expect.any(String),
        summary: expect.any(String),
        highlights: expect.any(Array),
        stack: expect.any(Array),
      })
    )
  })
})

describe('parseProjects', () => {
  it('parses valid project input', () => {
    const parsed = parseProjects([
      {
        id: 'demo',
        title: 'Demo Project',
        summary: 'A valid project payload',
        highlights: ['Validates at runtime'],
        stack: ['TypeScript'],
        repoUrl: 'https://github.com/example/demo',
      },
    ])

    expect(parsed).toEqual([
      {
        id: 'demo',
        title: 'Demo Project',
        summary: 'A valid project payload',
        highlights: ['Validates at runtime'],
        stack: ['TypeScript'],
        repoUrl: 'https://github.com/example/demo',
      },
    ])
  })

  it('throws a descriptive error for invalid project input', () => {
    expect(() =>
      parseProjects([
        {
          id: '',
          title: '',
          summary: '',
          highlights: [],
          stack: [],
        },
      ])
    ).toThrowError(/Invalid content\/projects\/projects\.json/)
  })
})
