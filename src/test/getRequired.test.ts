import { describe, expect, it } from 'vitest'

import { getRequired } from './getRequired'

describe('getRequired', () => {
  it('returns an item at a valid index', () => {
    expect(getRequired(['first'], 0, 'fixture')).toBe('first')
  })

  it('reports a missing fixture with its label and index', () => {
    expect(() => getRequired([], 2, 'project fixture')).toThrow(
      new RangeError('Expected project fixture at index 2')
    )
  })
})
