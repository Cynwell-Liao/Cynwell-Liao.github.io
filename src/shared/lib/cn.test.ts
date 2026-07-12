import { describe, expect, it } from 'vitest'

import { cn } from './cn'

describe('cn', () => {
  it('combines conditional classes and resolves Tailwind conflicts', () => {
    expect(cn('px-2 text-sm', ['px-4', { block: true, hidden: false }])).toBe(
      'text-sm px-4 block'
    )
  })
})
