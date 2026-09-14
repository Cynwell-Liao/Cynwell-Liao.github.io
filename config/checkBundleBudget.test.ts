import { spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

type Manifest = Record<
  string,
  {
    file: string
    isEntry?: boolean
    imports?: string[]
    dynamicImports?: string[]
  }
>

let temporaryDirectory: string | undefined

const createBuild = (
  manifest: Manifest,
  assets: Record<string, string | Buffer> = {},
  base = '/'
) => {
  temporaryDirectory = mkdtempSync(path.join(tmpdir(), 'portfolio-bundle-budget-'))
  mkdirSync(path.join(temporaryDirectory, '.vite'))
  writeFileSync(
    path.join(temporaryDirectory, 'index.html'),
    `<script type="module" src="${base}assets/entry.js"></script>`
  )
  writeFileSync(
    path.join(temporaryDirectory, '.vite/manifest.json'),
    JSON.stringify(manifest)
  )
  for (const [file, content] of Object.entries(assets)) {
    const filePath = path.join(temporaryDirectory, file)
    mkdirSync(path.dirname(filePath), { recursive: true })
    writeFileSync(filePath, content)
  }
  return temporaryDirectory
}

const checkBuild = (directory: string) =>
  spawnSync(process.execPath, ['scripts/check-bundle-budget.js', '--dist', directory], {
    encoding: 'utf8',
  })

afterEach(() => {
  if (temporaryDirectory) rmSync(temporaryDirectory, { force: true, recursive: true })
  temporaryDirectory = undefined
})

describe('initial JavaScript bundle budget', () => {
  it.each(['/', '/portfolio/'])(
    'follows static dependencies once and excludes deferred chunks with base %s',
    (base) => {
      const directory = createBuild(
        {
          'index.html': {
            file: 'assets/entry.js',
            isEntry: true,
            imports: ['left', 'right'],
            dynamicImports: ['terminal'],
          },
          left: { file: 'assets/left.js', imports: ['shared'] },
          right: { file: 'assets/right.js', imports: ['shared'] },
          shared: { file: 'assets/shared.js', imports: ['left'] },
          // A large deferred chunk must not count against the initial budget.
          terminal: { file: 'assets/terminal.js' },
        },
        {
          'assets/entry.js': 'e'.repeat(100_000),
          'assets/left.js': 'l'.repeat(100_000),
          'assets/right.js': 'r'.repeat(100_000),
          'assets/shared.js': 's'.repeat(100_000),
          'assets/terminal.js': 't'.repeat(700_000),
        },
        base
      )
      const result = checkBuild(directory)

      expect(result.status).toBe(0)
      expect(result.stdout).toContain('Total initial JavaScript: 400.00 kB raw')
      expect(result.stdout.match(/assets\/shared\.js:/g)).toHaveLength(1)
      expect(result.stdout).not.toContain('terminal.js')
    }
  )

  it('counts shared files only once across multiple entry points', () => {
    const result = checkBuild(
      createBuild(
        {
          first: { file: 'assets/entry.js', isEntry: true, imports: ['shared'] },
          second: { file: 'assets/other.js', isEntry: true, imports: ['shared'] },
          shared: { file: 'assets/shared.js' },
        },
        {
          'assets/entry.js': 'a'.repeat(100_000),
          'assets/other.js': 'b'.repeat(100_000),
          'assets/shared.js': 'c'.repeat(300_000),
        }
      )
    )

    expect(result.status).toBe(0)
    expect(result.stdout).toContain('Total initial JavaScript: 500.00 kB raw')
  })

  it('rejects aggregate raw size even when each initial file is within budget', () => {
    const result = checkBuild(
      createBuild(
        {
          entry: { file: 'assets/entry.js', isEntry: true, imports: ['shared'] },
          shared: { file: 'assets/shared.js' },
        },
        {
          'assets/entry.js': 'a'.repeat(310_000),
          'assets/shared.js': 'b'.repeat(310_000),
        }
      )
    )

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('total raw size 620.00 kB exceeds 600.00 kB')
    expect(result.stderr).not.toContain('exceeds 500.00 kB')
  })

  it('rejects aggregate gzip size independently of raw size', () => {
    const result = checkBuild(
      createBuild(
        {
          entry: { file: 'assets/entry.js', isEntry: true, imports: ['shared'] },
          shared: { file: 'assets/shared.js' },
        },
        {
          'assets/entry.js': randomBytes(110_000),
          'assets/shared.js': randomBytes(110_000),
        }
      )
    )

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('total gzip size')
    expect(result.stderr).toContain('exceeds 195.00 kB')
    expect(result.stderr).not.toContain('exceeds 170.00 kB')
  })

  it.each([
    ['raw', () => Buffer.alloc(500_001), '500.00'],
    ['gzip', () => randomBytes(180_000), '170.00'],
  ] as const)('retains the per-file %s budget', (_kind, makeContent, limit) => {
    const result = checkBuild(
      createBuild(
        { entry: { file: 'assets/entry.js', isEntry: true } },
        { 'assets/entry.js': makeContent() }
      )
    )

    expect(result.status).toBe(1)
    expect(result.stderr).toContain(`exceeds ${limit} kB (assets/entry.js)`)
  })

  it('fails when a referenced manifest chunk is missing', () => {
    const result = checkBuild(
      createBuild({
        entry: { file: 'assets/entry.js', isEntry: true, imports: ['missing'] },
      })
    )
    expect(result.status).toBe(1)
    expect(result.stderr).toContain(
      'Build manifest chunk is missing or invalid: missing'
    )
  })

  it('fails when a static asset is missing from disk', () => {
    const result = checkBuild(
      createBuild({ entry: { file: 'assets/entry.js', isEntry: true } })
    )
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Initial bundle asset is missing:')
  })

  it('fails when the manifest contains no initial JavaScript', () => {
    const result = checkBuild(createBuild({ deferred: { file: 'assets/terminal.js' } }))
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('No initial JavaScript assets were found')
  })

  it('fails when the build manifest is missing', () => {
    const directory = createBuild({})
    rmSync(path.join(directory, '.vite/manifest.json'))
    const result = checkBuild(directory)
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Build manifest was not found')
  })

  it.each([
    ['[]', 'Build manifest must be an object'],
    [
      '{"entry":{"file":"assets/entry.js","isEntry":true,"imports":"shared"}}',
      'Build manifest chunk imports are invalid: entry',
    ],
  ])('rejects an invalid manifest: %s', (manifest, message) => {
    const directory = createBuild({})
    writeFileSync(path.join(directory, '.vite/manifest.json'), manifest)
    const result = checkBuild(directory)
    expect(result.status).toBe(1)
    expect(result.stderr).toContain(message)
  })

  it('preserves the help option without requiring a build', () => {
    const result = spawnSync(
      process.execPath,
      ['scripts/check-bundle-budget.js', '--help'],
      {
        encoding: 'utf8',
      }
    )
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('--dist <directory>')
    expect(result.stdout).toContain('600 kB raw / 195 kB gzip in total')
  })

  it.each([
    '../outside.js',
    '%2e%2e%2foutside.js',
    '..\\outside.js',
    '/outside.js',
    'C:/outside.js',
    'https://example.com/outside.js',
  ])('rejects an asset outside the output directory: %s', (file) => {
    const result = checkBuild(createBuild({ entry: { file, isEntry: true } }))
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Initial bundle asset escapes the dist directory:')
  })
})
