import type { Transition } from 'framer-motion'

export const DOCK_LAUNCH_BOUNCES = 3
export const DOCK_LAUNCH_HOP_DURATION_SECONDS = 0.6

export const dockLaunchTransition = {
  duration: DOCK_LAUNCH_HOP_DURATION_SECONDS,
  repeat: DOCK_LAUNCH_BOUNCES - 1,
  times: [0, 0.5, 1],
  ease: ['easeOut', 'easeIn'],
} satisfies Transition
