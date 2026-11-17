import { m } from 'framer-motion'

import { DockIcon } from './DockIcon'

import type { DockItemInteraction } from '../model/useDockInteraction'
import type { Variants } from 'framer-motion'
import type { ComponentProps, ReactNode } from 'react'

interface DockAppItemProps {
  app: ComponentProps<typeof DockIcon>['app']
  label: string
  href?: string
  running: boolean
  launching: boolean
  reducedMotion: boolean
  size: number
  labelVisible: boolean
  interaction: DockItemInteraction
  menu: ReactNode
  onOpenTerminal: (opener: HTMLButtonElement) => void
  onOpenProfile: (url: string) => void
  onLaunchComplete: () => void
}

// Native launch bouncing repeats until the app is ready. For web destinations,
// use three hops before opening the tab; this cadence is a visual approximation.
// Each rigid rise/fall decelerates toward the apex, then accelerates to the shelf.
const launchVariants = {
  idle: { y: 0, transition: { duration: 0 } },
  launch: {
    y: [0, -26, 0],
    transition: {
      duration: 0.6,
      repeat: 2,
      times: [0, 0.5, 1],
      ease: ['easeOut', 'easeIn'],
    },
  },
} satisfies Variants

export function DockTooltip({
  label,
  visible,
  reducedMotion,
}: {
  label: string
  visible: boolean
  reducedMotion: boolean
}) {
  return (
    <m.span
      aria-hidden="true"
      className="desktop-dock__tooltip"
      animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 3 }}
      initial={false}
      transition={{ duration: reducedMotion ? 0 : 0.12 }}
    >
      {label}
    </m.span>
  )
}

export function DockAppItem({
  app,
  label,
  href,
  running,
  launching,
  reducedMotion,
  size,
  labelVisible,
  interaction,
  menu,
  onOpenTerminal,
  onOpenProfile,
  onLaunchComplete,
}: DockAppItemProps) {
  const launcherProps = {
    ...interaction,
    className: 'desktop-dock__app',
    'data-dock-app': app,
    'data-launching': launching,
    'aria-label': label,
  }
  const content = (
    <>
      <m.span
        aria-hidden="true"
        className="desktop-dock__launch"
        key={launching ? 'launch' : 'idle'}
        initial="idle"
        animate={launching ? 'launch' : 'idle'}
        variants={launchVariants}
        onAnimationComplete={(definition) => {
          if (definition === 'launch') onLaunchComplete()
        }}
      >
        <DockIcon app={app} />
      </m.span>
      <DockTooltip label={label} visible={labelVisible} reducedMotion={reducedMotion} />
      {running && <span aria-hidden="true" className="desktop-dock__running" />}
    </>
  )

  return (
    <m.div
      className="desktop-dock__slot"
      initial={false}
      animate={{ width: size, height: size }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { type: 'spring', mass: 0.2, stiffness: 400, damping: 22 }
      }
    >
      {app === 'terminal' ? (
        <button
          {...launcherProps}
          aria-haspopup="dialog"
          data-running={running}
          onClick={(event) => {
            onOpenTerminal(event.currentTarget)
          }}
          type="button"
        >
          {content}
        </button>
      ) : (
        <a
          {...launcherProps}
          href={href}
          onClick={(event) => {
            // Preserve browser shortcuts (new background tab/window, download).
            if (
              event.defaultPrevented ||
              event.button !== 0 ||
              event.metaKey ||
              event.ctrlKey ||
              event.shiftKey ||
              event.altKey
            )
              return
            // Reduced motion can use the anchor's native activation directly.
            if (reducedMotion) return
            event.preventDefault()
            onOpenProfile(event.currentTarget.href)
          }}
          rel="noopener noreferrer"
          target="_blank"
        >
          {content}
        </a>
      )}
      {menu}
    </m.div>
  )
}
