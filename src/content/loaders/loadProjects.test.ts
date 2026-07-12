import { describe, expect, it } from 'vitest'
import { ZodError } from 'zod'

import { parseProjects, projects } from './loadProjects'
import { createValidProjects } from './testFixtures'

describe('projects content', () => {
  it('exports a validated readonly project collection', () => {
    expect(projects.length).toBeGreaterThan(0)
  })

  it('parses and trims a valid project fixture', () => {
    const input = createValidProjects()
    input[0].title = '  Example Project  '

    expect(parseProjects(input)).toEqual([
      {
        ...createValidProjects()[0],
        title: 'Example Project',
      },
    ])
  })

  it.each([
    ['an empty collection', []],
    ['empty highlights', [{ ...createValidProjects()[0], highlights: [] }]],
    ['an invalid slug', [{ ...createValidProjects()[0], id: 'not a slug' }]],
    [
      'a non-HTTPS URL',
      [{ ...createValidProjects()[0], repoUrl: 'http://example.com/repository' }],
    ],
    ['an unknown property', [{ ...createValidProjects()[0], unexpected: true }]],
  ])('rejects %s', (_description, input) => {
    expect(() => parseProjects(input)).toThrow(/Invalid content\/data\/projects\.json/)
  })

  it('rejects project IDs that differ only by case', () => {
    const project = createValidProjects()[0]

    expect(() =>
      parseProjects([project, { ...project, id: project.id.toUpperCase() }])
    ).toThrow(/Project IDs must be unique \(case-insensitive\)/)
  })

  it('reports nested and root paths and preserves the Zod error as cause', () => {
    let nestedError: Error | undefined
    let rootError: Error | undefined

    try {
      parseProjects([{ ...createValidProjects()[0], title: '   ' }])
    } catch (error) {
      nestedError = error as Error
    }

    try {
      parseProjects({})
    } catch (error) {
      rootError = error as Error
    }

    expect(nestedError?.message).toContain('0.title')
    expect(nestedError?.cause).toBeInstanceOf(ZodError)
    expect(rootError?.message).toContain('<root>')
    expect(rootError?.cause).toBeInstanceOf(ZodError)
  })
})
