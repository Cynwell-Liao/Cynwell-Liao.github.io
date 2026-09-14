import { ESLint } from 'eslint'
import { beforeAll, describe, expect, it } from 'vitest'

const eslint = new ESLint()

// Initializing ESLint's TypeScript project service can exceed a test's default
// timeout on a cold Windows checkout. Keep that startup separate from assertions.
beforeAll(async () => {
  await eslint.lintText('export {}', { filePath: 'src/app/App.tsx' })
}, 30_000)

const boundaryMessages = async (filePath: string, source: string) => {
  const [result] = await eslint.lintText(source, { filePath })
  expect(result.fatalErrorCount).toBe(0)
  expect(
    result.messages.filter(({ ruleId }) => ruleId === 'import/no-unresolved')
  ).toEqual([])
  return result.messages.filter(({ ruleId }) => ruleId === 'import/no-restricted-paths')
}

describe('resolved module boundaries', () => {
  it.each([
    ['src/app/App.tsx', '@features/projects/ui/ProjectsSection'],
    ['src/app/App.tsx', '../features/projects/ui/ProjectsSection'],
    ['src/app/App.tsx', '@content/loaders/loadProjects'],
    ['src/app/App.tsx', '../content/loaders/loadProjects'],
    ['src/app/App.tsx', '../content/data/projects.json'],
    ['src/features/about/ui/AboutSection.tsx', '../../projects/model/project.types'],
    ['src/shared/types/portfolio.types.ts', '@features/projects'],
    ['src/shared/types/portfolio.types.ts', '@content'],
    ['src/features/about/ui/AboutSection.tsx', '@content'],
    ['src/content/index.ts', '@features/projects'],
  ])('rejects %s importing %s', async (filePath, specifier) => {
    expect(await boundaryMessages(filePath, `import '${specifier}'`)).not.toHaveLength(
      0
    )
  })

  it.each([
    ['src/app/App.tsx', '@features/projects'],
    ['src/app/App.tsx', '../features/projects'],
    ['src/app/App.tsx', '@content'],
    ['src/app/App.tsx', '../content'],
    ['src/features/about/ui/AboutSection.tsx', '@features/projects'],
    ['src/features/projects/index.ts', './ui/ProjectsSection'],
    ['src/features/projects/ui/ProjectsSection.tsx', '../model/project.types'],
    [
      'src/features/projects/ui/ProjectsSection.tsx',
      '@features/projects/model/project.types',
    ],
    ['src/content/index.ts', './loaders/loadProjects'],
    ['src/content/loaders/loadProjects.ts', '../schemas/project.schema'],
    ['src/content/loaders/loadProjects.ts', '@content/schemas/project.schema'],
  ])('allows %s importing %s', async (filePath, specifier) => {
    expect(await boundaryMessages(filePath, `import '${specifier}'`)).toEqual([])
  })

  it('also rejects dynamic imports and re-exports of another module internals', async () => {
    expect(
      await boundaryMessages(
        'src/app/App.tsx',
        "export { ProjectsSection } from '../features/projects/ui/ProjectsSection'"
      )
    ).toHaveLength(1)
    expect(
      await boundaryMessages(
        'src/app/App.tsx',
        "void import('../features/terminal/ui/TerminalWindow')"
      )
    ).toHaveLength(1)
  })
})
