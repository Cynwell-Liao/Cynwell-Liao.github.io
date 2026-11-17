import { AnimatePresence, m, useReducedMotion } from 'framer-motion'
import { useEffect, useRef } from 'react'

import { DOCK_GAP } from '../model/magnification'
import { useDockInteraction } from '../model/useDockInteraction'
import { openLaunchedProfile, useDockLaunch } from '../model/useDockLaunch'

import { DockAppItem, DockTooltip } from './DockAppItem'
import { DockMenu } from './DockMenu'
import { DockMinimizedWindow } from './DockMinimizedWindow'

import './DesktopDock.css'

interface DesktopDockProps {
  fullscreen?: boolean
  githubUrl: string
  linkedinUrl: string
  terminalOpen: boolean
  terminalMinimized?: boolean
  onOpenTerminal: (opener: HTMLButtonElement) => void
  onRestoreTerminal?: () => void
  onQuitTerminal?: () => void
}

const apps = [
  { id: 'github', label: 'GitHub' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'terminal', label: 'Terminal' },
] as const

const MINIMIZED_INDEX = apps.length

export function DesktopDock({
  fullscreen = false,
  githubUrl,
  linkedinUrl,
  terminalOpen,
  terminalMinimized = false,
  onOpenTerminal,
  onRestoreTerminal,
  onQuitTerminal,
}: DesktopDockProps) {
  const reducedMotion = Boolean(useReducedMotion())
  const showMinimized = terminalOpen && terminalMinimized
  const {
    activeLabel,
    clearLabels,
    dismissMenu,
    interactionFor,
    isHidden,
    menu,
    positionInteraction,
    reveal,
    sizeAt,
    toolbarInteraction,
  } = useDockInteraction({ fullscreen, reducedMotion, showMinimized })
  const { launching, startLaunch, completeLaunch, cancelLaunch } = useDockLaunch()
  const minimizedRef = useRef<HTMLButtonElement>(null)

  // Like macOS, the minimized window lands in the Dock; keep keyboard focus
  // with it so the window can be restored without hunting for it.
  useEffect(() => {
    if (showMinimized) minimizedRef.current?.focus({ preventScroll: true })
  }, [showMinimized])

  const appMenu = (index: number) => {
    if (menu?.index !== index) return null
    const app = index === MINIMIZED_INDEX ? null : apps[index]
    const isTerminal = app?.id === 'terminal'
    const activate = () => {
      if (index === MINIMIZED_INDEX) onRestoreTerminal?.()
      else menu.opener.click()
    }
    const actions = [
      { label: isTerminal && terminalOpen ? 'Show' : 'Open', onSelect: activate },
    ]
    if (isTerminal && terminalOpen && onQuitTerminal) {
      return (
        <DockMenu
          label={app.label}
          opener={menu.opener}
          actions={[
            ...actions,
            {
              label: 'Quit',
              separatorBefore: true,
              onSelect: () => {
                onQuitTerminal()
                menu.opener.focus({ preventScroll: true })
              },
            },
          ]}
          onDismiss={dismissMenu}
        />
      )
    }
    return (
      <DockMenu
        label={app?.label ?? 'Terminal'}
        opener={menu.opener}
        actions={actions}
        onDismiss={dismissMenu}
      />
    )
  }

  return (
    <div
      {...positionInteraction}
      className="desktop-dock-position"
      data-auto-hidden={isHidden}
    >
      {fullscreen && (
        <div
          aria-hidden="true"
          className="desktop-dock__reveal"
          onPointerEnter={reveal}
        />
      )}
      <m.nav
        aria-label="Application Dock"
        animate={{ y: isHidden ? 'calc(100% + 24px)' : 0 }}
        initial={false}
        transition={{ duration: reducedMotion ? 0 : 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          {...toolbarInteraction}
          aria-label="Dock apps"
          className="desktop-dock"
          role="toolbar"
        >
          <div aria-hidden="true" className="desktop-dock__glass" />
          {apps.map((app, index) => {
            const running = app.id === 'terminal' && terminalOpen
            const launchApp = (action: () => void) => {
              clearLabels()
              // Running apps activate in place; only a cold launch bounces.
              startLaunch(index, action, reducedMotion || running)
            }
            return (
              <DockAppItem
                app={app.id}
                key={app.id}
                label={app.label}
                href={app.id === 'github' ? githubUrl : linkedinUrl}
                running={running}
                launching={launching.includes(index)}
                reducedMotion={reducedMotion}
                size={sizeAt(index)}
                labelVisible={activeLabel === index}
                interaction={interactionFor(index)}
                menu={appMenu(index)}
                onLaunchComplete={() => {
                  completeLaunch(index)
                }}
                onOpenTerminal={(opener) => {
                  launchApp(() => {
                    onOpenTerminal(opener)
                  })
                }}
                onOpenProfile={(url) => {
                  // One user activation can open one tab. A newer profile choice
                  // replaces the pending one instead of losing it to popup blocking.
                  cancelLaunch(index === 0 ? 1 : 0)
                  launchApp(() => {
                    openLaunchedProfile(url)
                  })
                }}
              />
            )
          })}
          <AnimatePresence initial={false}>
            {showMinimized && (
              <m.span
                animate={{ opacity: 1, width: 1, marginInline: 0 }}
                aria-hidden="true"
                className="desktop-dock__separator"
                exit={{ opacity: 0, width: 0, marginInline: -DOCK_GAP / 2 }}
                initial={{ opacity: 0, width: 0, marginInline: -DOCK_GAP / 2 }}
                key="separator"
                transition={{ duration: reducedMotion ? 0 : 0.25 }}
              />
            )}
            {showMinimized && (
              <m.div
                animate={{
                  opacity: 1,
                  width: sizeAt(MINIMIZED_INDEX),
                  height: sizeAt(MINIMIZED_INDEX),
                  marginInline: 0,
                }}
                className="desktop-dock__slot"
                exit={{ opacity: 0, width: 0, marginInline: -DOCK_GAP / 2 }}
                initial={{ opacity: 0, width: 0, marginInline: -DOCK_GAP / 2 }}
                key="minimized-terminal"
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : { type: 'spring', mass: 0.2, stiffness: 400, damping: 22 }
                }
              >
                <button
                  {...interactionFor(MINIMIZED_INDEX)}
                  aria-label="Restore terminal"
                  className="desktop-dock__app"
                  data-dock-app="terminal-window"
                  onClick={() => {
                    clearLabels()
                    onRestoreTerminal?.()
                  }}
                  ref={minimizedRef}
                  type="button"
                >
                  <DockMinimizedWindow />
                  <DockTooltip
                    label="Terminal"
                    visible={activeLabel === MINIMIZED_INDEX}
                    reducedMotion={reducedMotion}
                  />
                </button>
                {appMenu(MINIMIZED_INDEX)}
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </m.nav>
    </div>
  )
}
