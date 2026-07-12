import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { createElement, forwardRef, Fragment } from 'react'
import { afterEach, beforeEach, vi } from 'vitest'

import type { ComponentType, ReactNode } from 'react'

const TRANSIENT_MOTION_PROPS = [
  'initial',
  'animate',
  'exit',
  'whileInView',
  'whileHover',
  'whileTap',
  'whileDrag',
  'variants',
  'transition',
  'viewport',
  'layout',
  'drag',
  'dragConstraints',
  'dragControls',
  'dragElastic',
  'dragListener',
  'dragMomentum',
] as const

type MockMotionProps = {
  [key: string]: unknown
  children?: ReactNode
}

interface MotionMockState {
  reducedMotion: boolean
  scrollY: number
}

const motionMockState: MotionMockState = {
  reducedMotion: true,
  scrollY: 0,
}

const scrollListeners = new Set<(value: number) => void>()

export function setMockReducedMotion(reducedMotion: boolean) {
  motionMockState.reducedMotion = reducedMotion
}

export function setMockScrollY(scrollY: number) {
  motionMockState.scrollY = scrollY
  scrollListeners.forEach((listener) => {
    listener(scrollY)
  })
}

const stripTransientMotionProps = (props: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(props).filter(
      ([key]) =>
        !TRANSIENT_MOTION_PROPS.includes(key as (typeof TRANSIENT_MOTION_PROPS)[number])
    )
  )

vi.mock('framer-motion', () => {
  const componentCache = new Map<string, ComponentType<MockMotionProps>>()
  const motion = new Proxy(
    {},
    {
      get: (_, key: string | symbol) => {
        const tagName = typeof key === 'string' ? key : 'div'
        const cachedComponent = componentCache.get(tagName)
        if (cachedComponent) {
          return cachedComponent
        }

        const MockMotionComponent = forwardRef<HTMLElement, MockMotionProps>(
          ({ children, ...restProps }, ref) =>
            createElement(
              tagName,
              { ...stripTransientMotionProps(restProps), ref },
              (children as ReactNode) ?? null
            )
        )
        MockMotionComponent.displayName = `MockMotion.${tagName}`
        componentCache.set(tagName, MockMotionComponent)
        return MockMotionComponent
      },
    }
  )

  const motionValue = {
    get: () => motionMockState.scrollY,
    on: (_eventName: string, listener: (value: number) => void) => {
      scrollListeners.add(listener)
      return () => {
        scrollListeners.delete(listener)
      }
    },
  }

  const Passthrough = ({ children }: { children?: ReactNode }) =>
    createElement(Fragment, null, children)

  return {
    AnimatePresence: Passthrough,
    domAnimation: {},
    LazyMotion: Passthrough,
    m: motion,
    motion,
    MotionConfig: Passthrough,
    useDragControls: () => ({
      start: () => undefined,
      stop: () => undefined,
      cancel: () => undefined,
    }),
    useScroll: () => ({
      scrollY: motionValue,
      scrollYProgress: motionValue,
    }),
    useReducedMotion: () => motionMockState.reducedMotion,
    useTransform: () => 0,
  }
})

Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  writable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }),
})

class ResizeObserverMock implements ResizeObserver {
  observe() {
    return undefined
  }

  unobserve() {
    return undefined
  }

  disconnect() {
    return undefined
  }
}

Object.defineProperty(globalThis, 'ResizeObserver', {
  configurable: true,
  value: ResizeObserverMock,
  writable: true,
})

beforeEach(() => {
  motionMockState.reducedMotion = true
  motionMockState.scrollY = 0
  scrollListeners.clear()

  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ totalContributions: 123 }),
        ok: true,
        status: 200,
      })
    )
  )
})

afterEach(() => {
  cleanup()
  localStorage.clear()
  sessionStorage.clear()
  document.documentElement.className = ''
  document.documentElement.removeAttribute('style')
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})
