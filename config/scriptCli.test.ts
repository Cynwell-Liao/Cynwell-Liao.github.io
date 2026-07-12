import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

const repositoryRoot = process.cwd()
let temporaryDirectory: string | undefined

const createTemporaryDirectory = (): string => {
  temporaryDirectory ??= mkdtempSync(path.join(tmpdir(), 'portfolio-script-cli-'))

  return temporaryDirectory
}

const runScript = (scriptName: string, arguments_: readonly string[]) =>
  spawnSync(
    process.execPath,
    [path.join(repositoryRoot, 'scripts', scriptName), ...arguments_],
    {
      cwd: repositoryRoot,
      encoding: 'utf8',
    }
  )

afterEach(() => {
  if (temporaryDirectory) rmSync(temporaryDirectory, { force: true, recursive: true })
  temporaryDirectory = undefined
})

describe('script command-line validation', () => {
  it('rejects a non-SVG OG cover input before launching Chromium', () => {
    const result = runScript('build-og-image.js', [
      '--input',
      path.join(repositoryRoot, 'package.json'),
      '--output',
      path.join(createTemporaryDirectory(), 'cover.png'),
    ])

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('OG image input must be an SVG file')
  })

  it('rejects unsupported avatar image formats without writing output', () => {
    const result = runScript('embed-og-avatar.js', [
      '--image',
      path.join(repositoryRoot, 'package.json'),
      '--output',
      path.join(createTemporaryDirectory(), 'cover.svg'),
    ])

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Unsupported avatar image extension: .json')
  })

  it('rejects a bundle directory without a built index', () => {
    const result = runScript('check-bundle-budget.js', [
      '--dist',
      createTemporaryDirectory(),
    ])

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('Built index.html was not found')
  })
})
