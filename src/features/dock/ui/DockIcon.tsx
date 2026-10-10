const artwork = {
  github: 'github.svg',
  linkedin: 'linkedin.jpg',
  terminal: 'terminal.svg',
} as const

export function DockIcon({ app }: { app: 'github' | 'linkedin' | 'terminal' }) {
  return (
    <span
      aria-hidden="true"
      className={`desktop-dock__icon desktop-dock__icon--${app}`}
    >
      <img
        alt=""
        className="desktop-dock__artwork"
        draggable={false}
        height={400}
        src={`${import.meta.env.BASE_URL}assets/dock/${artwork[app]}`}
        width={400}
      />
    </span>
  )
}
