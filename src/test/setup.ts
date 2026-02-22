import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { createElement, forwardRef } from 'react'
import { afterEach, beforeEach, vi } from 'vitest'

import type { ReactNode } from 'react'

const TRANSIENT_MOTION_PROPS = [
  'initial',
  'animate',
  'exit',
  'whileInView',
  'whileHover',
  'whileTap',
  'variants',
  'transition',
  'viewport',
  'layout',
]

type MockMotionProps = {
  [key: string]: unknown
  children?: unknown
}

const stripTransientMotionProps = (props: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(props).filter(([key]) => !TRANSIENT_MOTION_PROPS.includes(key))
  )

vi.mock('framer-motion', () => {
  const motion = new Proxy(
    {},
    {
      get: (_, key: string | symbol) => {
        const tagName = typeof key === 'string' ? key : 'div'

        return forwardRef<HTMLElement, MockMotionProps>(
          ({ children, ...restProps }, ref) =>
            createElement(
              tagName,
              { ...stripTransientMotionProps(restProps), ref },
              (children as ReactNode) ?? null
            )
        )
      },
    }
  )

  const motionValue = {
    on: () => () => {
      return undefined
    },
    get: () => 0,
  }

  return {
    motion,
    useScroll: () => ({
      scrollY: motionValue,
      scrollYProgress: motionValue,
    }),
    useTransform: () => 0,
  }
})

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {
      return undefined
    },
    removeListener: () => {
      return undefined
    },
    addEventListener: () => {
      return undefined
    },
    removeEventListener: () => {
      return undefined
    },
    dispatchEvent: () => false,
  }),
})

if (!('ResizeObserver' in window)) {
  class ResizeObserverMock {
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

  vi.stubGlobal('ResizeObserver', ResizeObserverMock)
}

beforeEach(() => {
  const fetchMock = vi.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ totalContributions: 123 }),
    })
  )

  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
