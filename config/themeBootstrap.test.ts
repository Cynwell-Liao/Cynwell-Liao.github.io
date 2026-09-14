import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

import { describe, expect, it, vi } from 'vitest'

const html = readFileSync('index.html', 'utf8')
const bootstrap = html.match(/<script>([\s\S]*?)<\/script>/u)?.[1]
if (!bootstrap) throw new Error('Inline theme bootstrap is missing')

describe('pre-paint theme bootstrap', () => {
  it.each([
    { stored: 'light', systemDark: true, denied: false, expected: 'light' },
    { stored: 'dark', systemDark: false, denied: false, expected: 'dark' },
    { stored: null, systemDark: true, denied: false, expected: 'dark' },
    { stored: null, systemDark: false, denied: false, expected: 'light' },
    { stored: 'sepia', systemDark: true, denied: false, expected: 'dark' },
    { stored: 'sepia', systemDark: false, denied: false, expected: 'light' },
    { stored: null, systemDark: true, denied: true, expected: 'dark' },
    { stored: null, systemDark: false, denied: true, expected: 'light' },
  ])(
    'applies $expected for $stored / system dark=$systemDark / denied=$denied',
    ({ stored, systemDark, denied, expected }) => {
      const toggle = vi.fn()
      const style = { colorScheme: '' }
      const getItem = vi.fn(() => {
        if (denied) throw new Error('Storage unavailable')
        return stored
      })
      runInNewContext(bootstrap, {
        window: {
          localStorage: { getItem },
          matchMedia: () => ({ matches: systemDark }),
        },
        document: { documentElement: { classList: { toggle }, style } },
      })
      expect(getItem).toHaveBeenCalledWith('portfolio-theme')
      expect(style.colorScheme).toBe(expected)
      expect(toggle).toHaveBeenCalledWith('dark', expected === 'dark')
    }
  )
})
