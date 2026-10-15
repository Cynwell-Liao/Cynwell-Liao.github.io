import { FaGithub, FaLinkedinIn } from 'react-icons/fa'
import { FiTerminal } from 'react-icons/fi'

const icons = {
  // Crop the library's built-in padding so tile placement follows the visible mark.
  github: { component: FaGithub, viewBox: '0 8 496 496' },
  linkedin: { component: FaLinkedinIn, viewBox: '0 0 448 448' },
  terminal: { component: FiTerminal, viewBox: '0 0 24 24' },
} as const

export function DockIcon({ app }: { app: keyof typeof icons }) {
  const { component: Icon, viewBox } = icons[app]

  return (
    <span
      aria-hidden="true"
      className={`desktop-dock__icon desktop-dock__icon--${app}`}
    >
      <Icon
        aria-hidden="true"
        className="desktop-dock__glyph"
        focusable="false"
        viewBox={viewBox}
      />
    </span>
  )
}
