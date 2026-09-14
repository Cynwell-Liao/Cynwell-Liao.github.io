import type { MotionProps } from 'framer-motion'

export const cardReveal = (delay: number) =>
  ({
    initial: { opacity: 0, y: 30 },
    transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] },
    viewport: { once: true, amount: 0.2 },
    whileInView: { opacity: 1, y: 0 },
  }) satisfies MotionProps
