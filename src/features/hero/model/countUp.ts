import { useEffect, useState } from 'react'

export type CountUpPhase = 'idle' | 'counting' | 'holding' | 'complete'

export interface CountUpState {
  value: number
  phase: CountUpPhase
}

interface UseCountUpNumberOptions {
  target: number | null
  shouldAnimate: boolean
  durationMs?: number
  startDelayMs?: number
  finalHoldMs?: number
}

const DEFAULT_COUNT_UP_DURATION_MS = 1600

export const normalizeCountUpTarget = (target: number): number =>
  Math.max(0, Math.floor(target))

export const easeOutCubic = (progress: number): number => {
  const clampedProgress = Math.min(Math.max(progress, 0), 1)

  return 1 - (1 - clampedProgress) ** 3
}

export const calculateCountUpValue = ({
  target,
  progress,
}: {
  target: number
  progress: number
}): number => {
  const normalizedTarget = normalizeCountUpTarget(target)

  if (progress >= 1) {
    return normalizedTarget
  }

  return Math.min(
    normalizedTarget,
    Math.floor(easeOutCubic(progress) * normalizedTarget)
  )
}

export const useCountUpNumber = ({
  target,
  shouldAnimate,
  durationMs = DEFAULT_COUNT_UP_DURATION_MS,
  startDelayMs = 0,
  finalHoldMs = 0,
}: UseCountUpNumberOptions): CountUpState => {
  const normalizedTarget = target === null ? null : normalizeCountUpTarget(target)
  const animationTarget = normalizedTarget ?? 0
  const [animatedState, setAnimatedState] = useState<CountUpState>({
    value: 0,
    phase: 'counting',
  })
  const canAnimate =
    shouldAnimate &&
    normalizedTarget !== null &&
    animationTarget > 0 &&
    typeof window.requestAnimationFrame === 'function'

  useEffect(() => {
    if (!canAnimate) {
      return
    }

    const currentAnimationTarget = animationTarget
    const safeDurationMs = Math.max(1, durationMs)
    const safeStartDelayMs = Math.max(0, startDelayMs)
    const safeFinalHoldMs = Math.max(0, finalHoldMs)
    let animationFrameId: number | null = null
    let startDelayTimeoutId: number | null = null
    let finalHoldTimeoutId: number | null = null
    let startTime: number | null = null
    let isCancelled = false

    const completeAnimation = () => {
      if (!isCancelled) {
        setAnimatedState({ value: currentAnimationTarget, phase: 'complete' })
      }
    }

    const step = (timestamp: number) => {
      if (isCancelled) {
        return
      }

      startTime ??= timestamp
      const progress = Math.min((timestamp - startTime) / safeDurationMs, 1)

      if (progress >= 1) {
        setAnimatedState({
          value: currentAnimationTarget,
          phase: safeFinalHoldMs > 0 ? 'holding' : 'complete',
        })

        if (safeFinalHoldMs > 0) {
          finalHoldTimeoutId = window.setTimeout(completeAnimation, safeFinalHoldMs)
        }

        return
      }

      setAnimatedState({
        value: calculateCountUpValue({ target: currentAnimationTarget, progress }),
        phase: 'counting',
      })
      animationFrameId = window.requestAnimationFrame(step)
    }

    const startAnimation = () => {
      if (!isCancelled) {
        animationFrameId = window.requestAnimationFrame(step)
      }
    }

    if (safeStartDelayMs > 0) {
      startDelayTimeoutId = window.setTimeout(startAnimation, safeStartDelayMs)
    } else {
      startAnimation()
    }

    return () => {
      isCancelled = true

      if (startDelayTimeoutId !== null) {
        window.clearTimeout(startDelayTimeoutId)
      }

      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId)
      }

      if (finalHoldTimeoutId !== null) {
        window.clearTimeout(finalHoldTimeoutId)
      }
    }
  }, [animationTarget, canAnimate, durationMs, finalHoldMs, startDelayMs])

  if (normalizedTarget === null) {
    return { value: 0, phase: 'idle' }
  }

  return canAnimate ? animatedState : { value: normalizedTarget, phase: 'complete' }
}
