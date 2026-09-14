import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useContributionTotal } from './useContributionTotal'

const successfulResponse = (payload: unknown) => ({
  json: () => Promise.resolve(payload),
  ok: true,
  status: 200,
})

function pendingRequest() {
  let resolve!: (value: ReturnType<typeof successfulResponse>) => void
  let reject!: (reason: Error) => void
  const promise = new Promise<ReturnType<typeof successfulResponse>>(
    (resolvePromise, rejectPromise) => {
      resolve = resolvePromise
      reject = rejectPromise
    }
  )
  return { promise, resolve, reject }
}

describe('useContributionTotal', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it.each([0, 1234])(
    'loads a valid total of %s and clears its timeout',
    async (total) => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      const request = pendingRequest()
      const fetchMock = vi.fn(() => request.promise)
      vi.stubGlobal('fetch', fetchMock)
      const { result } = renderHook(() => useContributionTotal('ada-lovelace'))

      expect(result.current).toMatchObject({ status: 'loading', total: null })
      expect(fetchMock).toHaveBeenCalledWith(
        'https://github-contributions-api.jogruber.de/v4/ada-lovelace?y=last',
        expect.objectContaining({
          referrerPolicy: 'no-referrer',
          signal: expect.any(AbortSignal),
        })
      )

      await act(async () => {
        request.resolve(successfulResponse({ total: { lastYear: total } }))
        await request.promise
      })

      expect(result.current).toMatchObject({ status: 'success', total })
      expect(vi.getTimerCount()).toBe(0)
    }
  )

  it.each([
    ['a rejected request', () => Promise.reject(new Error('offline'))],
    [
      'a non-success response',
      () => Promise.resolve({ ...successfulResponse({}), ok: false, status: 503 }),
    ],
    [
      'an invalid total',
      () => Promise.resolve(successfulResponse({ total: { lastYear: -1 } })),
    ],
    [
      'malformed JSON',
      () =>
        Promise.resolve({
          json: () => Promise.reject(new Error('invalid JSON')),
          ok: true,
          status: 200,
        }),
    ],
  ])('reports an error for %s', async (_label, responseFactory) => {
    vi.stubGlobal('fetch', vi.fn(responseFactory))
    const { result } = renderHook(() => useContributionTotal('ada-lovelace'))

    await waitFor(() => {
      expect(result.current).toMatchObject({ status: 'error', total: null })
    })
  })

  it.each(['resolve', 'reject'] as const)(
    'times out after eight seconds and ignores a late %s',
    async (completion) => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
      const request = pendingRequest()
      let requestSignal: AbortSignal | null | undefined
      vi.stubGlobal(
        'fetch',
        vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
          requestSignal = init?.signal
          return request.promise
        })
      )
      const { result } = renderHook(() => useContributionTotal('ada-lovelace'))

      act(() => {
        vi.advanceTimersByTime(7999)
      })
      expect(result.current.status).toBe('loading')
      expect(requestSignal?.aborted).toBe(false)
      act(() => {
        vi.advanceTimersByTime(1)
      })
      expect(requestSignal?.aborted).toBe(true)
      expect(result.current).toMatchObject({ status: 'error', total: null })

      await act(async () => {
        if (completion === 'resolve') {
          request.resolve(successfulResponse({ total: { lastYear: 999 } }))
        } else {
          request.reject(new Error('aborted'))
        }
        await Promise.resolve()
      })

      expect(result.current).toMatchObject({ status: 'error', total: null })
      expect(vi.getTimerCount()).toBe(0)
    }
  )

  it.each(['resolve', 'reject'] as const)(
    'aborts obsolete requests and ignores their late %s',
    async (completion) => {
      const oldRequest = pendingRequest()
      const newRequest = pendingRequest()
      let oldSignal: AbortSignal | null | undefined
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockImplementationOnce((_input: RequestInfo | URL, init?: RequestInit) => {
            oldSignal = init?.signal
            return oldRequest.promise
          })
          .mockReturnValueOnce(newRequest.promise)
      )
      const { result, rerender } = renderHook(
        ({ username }) => useContributionTotal(username),
        { initialProps: { username: 'ada-lovelace' } }
      )

      rerender({ username: 'grace-hopper' })
      expect(oldSignal?.aborted).toBe(true)
      expect(result.current).toMatchObject({ status: 'loading', total: null })
      await act(async () => {
        newRequest.resolve(successfulResponse({ total: { lastYear: 42 } }))
        await newRequest.promise
      })
      await act(async () => {
        if (completion === 'resolve') {
          oldRequest.resolve(successfulResponse({ total: { lastYear: 999 } }))
        } else {
          oldRequest.reject(new Error('obsolete request'))
        }
        await Promise.resolve()
      })

      expect(result.current).toMatchObject({ status: 'success', total: 42 })
    }
  )

  it('does not reuse a previous total when changing back to that username', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(successfulResponse({ total: { lastYear: 123 } }))
        .mockImplementation(() => new Promise<never>(() => undefined))
    )
    const { result, rerender } = renderHook(
      ({ username }) => useContributionTotal(username),
      { initialProps: { username: 'ada-lovelace' } }
    )
    await waitFor(() => {
      expect(result.current.status).toBe('success')
    })

    rerender({ username: 'grace-hopper' })
    rerender({ username: 'ada-lovelace' })

    expect(result.current).toMatchObject({ status: 'loading', total: null })
  })

  it('aborts and clears the timeout on unmount', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    let requestSignal: AbortSignal | null | undefined
    vi.stubGlobal(
      'fetch',
      vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
        requestSignal = init?.signal
        return new Promise<never>(() => undefined)
      })
    )
    const { unmount } = renderHook(() => useContributionTotal('ada-lovelace'))

    unmount()

    expect(requestSignal?.aborted).toBe(true)
    expect(vi.getTimerCount()).toBe(0)
  })
})
