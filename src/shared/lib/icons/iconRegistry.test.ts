import { describe, expect, it } from 'vitest'

import { ICON_KEYS, isIconKey, resolveIcon } from './index'

describe('icon registry', () => {
  it('resolves every declared icon key', () => {
    ICON_KEYS.forEach((key) => {
      expect(resolveIcon(key)).toEqual(expect.any(Function))
    })
  })

  it('returns no icon when no key is supplied', () => {
    expect(resolveIcon(undefined)).toBeUndefined()
  })

  it('narrows only registered string values', () => {
    expect(isIconKey('typescript')).toBe(true)
    expect(isIconKey('unknown-icon')).toBe(false)
    expect(isIconKey(null)).toBe(false)
  })
})
