import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  calculateCountUpValue,
  easeOutCubic,
  normalizeCountUpTarget,
  useCountUpNumber,
} from './countUp'

import type { CountUpState } from './countUp'

interface CountUpProbeProps {
  target: number | null
  startDelayMs?: number
  finalHoldMs?: number
}

const CountUpProbe = ({
  target,
  startDelayMs = 0,
  finalHoldMs = 0,
}: CountUpProbeProps) => {
  const countUpState: CountUpState = useCountUpNumber({
    target,
    shouldAnimate: true,
    durationMs: 100,
    startDelayMs,
    finalHoldMs,
  })

  return (
    <output data-phase={countUpState.phase} data-testid="count-up-value">
      {countUpState.value}
    </output>
  )
}

describe('countUp', () => {
  let queuedFrames: FrameRequestCallback[]
  let originalRequestAnimationFrame: typeof window.requestAnimationFrame
  let originalCancelAnimationFrame: typeof window.cancelAnimationFrame

  beforeEach(() => {
    queuedFrames = []
    originalRequestAnimationFrame = window.requestAnimationFrame
    originalCancelAnimationFrame = window.cancelAnimationFrame

    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      value: vi.fn((callback: FrameRequestCallback) => {
        queuedFrames.push(callback)
        return queuedFrames.length
      }),
    })
    Object.defineProperty(window, 'cancelAnimationFrame', {
      configurable: true,
      value: vi.fn(),
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'requestAnimationFrame', {
      configurable: true,
      value: originalRequestAnimationFrame,
    })
    Object.defineProperty(window, 'cancelAnimationFrame', {
      configurable: true,
      value: originalCancelAnimationFrame,
    })
    vi.useRealTimers()
  })

  const runNextFrame = (timestamp: number) => {
    const nextFrame = queuedFrames.shift()

    if (!nextFrame) {
      throw new Error('Expected a queued animation frame')
    }

    act(() => {
      nextFrame(timestamp)
    })
  }

  it('normalizes count targets to non-negative integers', () => {
    expect(normalizeCountUpTarget(10.9)).toBe(10)
    expect(normalizeCountUpTarget(0)).toBe(0)
    expect(normalizeCountUpTarget(-5)).toBe(0)
  })

  it('calculates eased count-up values without exceeding the target', () => {
    expect(easeOutCubic(-1)).toBe(0)
    expect(easeOutCubic(1.5)).toBe(1)
    expect(calculateCountUpValue({ target: 100, progress: 0 })).toBe(0)
    expect(calculateCountUpValue({ target: 100, progress: 0.5 })).toBeGreaterThan(0)
    expect(calculateCountUpValue({ target: 100, progress: 0.5 })).toBeLessThan(100)
    expect(calculateCountUpValue({ target: 100, progress: 1 })).toBe(100)
    expect(calculateCountUpValue({ target: 100, progress: 2 })).toBe(100)
  })

  it('keeps the counter at zero until the start delay elapses', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })

    render(<CountUpProbe startDelayMs={300} target={100} />)

    const output = screen.getByTestId('count-up-value')
    expect(output).toHaveTextContent('0')
    expect(queuedFrames).toHaveLength(0)

    act(() => {
      vi.advanceTimersByTime(299)
    })

    expect(output).toHaveTextContent('0')
    expect(queuedFrames).toHaveLength(0)

    act(() => {
      vi.advanceTimersByTime(1)
    })

    expect(queuedFrames).toHaveLength(1)
  })

  it('holds the final number for one phase before completing', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })

    render(<CountUpProbe finalHoldMs={250} target={500} />)

    const output = screen.getByTestId('count-up-value')
    expect(output).toHaveTextContent('0')
    expect(output).toHaveAttribute('data-phase', 'counting')

    runNextFrame(0)
    runNextFrame(50)

    expect(Number(output.textContent)).toBeGreaterThan(0)
    expect(output).toHaveAttribute('data-phase', 'counting')

    runNextFrame(100)

    expect(output).toHaveTextContent('500')
    expect(output).toHaveAttribute('data-phase', 'holding')

    act(() => {
      vi.advanceTimersByTime(250)
    })

    expect(output).toHaveTextContent('500')
    expect(output).toHaveAttribute('data-phase', 'complete')
  })

  it('resets its visible state when the animation target changes', () => {
    const { rerender } = render(<CountUpProbe target={100} />)
    const output = screen.getByTestId('count-up-value')

    runNextFrame(0)
    runNextFrame(100)
    expect(output).toHaveTextContent('100')
    expect(output).toHaveAttribute('data-phase', 'complete')

    rerender(<CountUpProbe target={200} />)

    expect(output).toHaveTextContent('0')
    expect(output).toHaveAttribute('data-phase', 'counting')
  })
})
