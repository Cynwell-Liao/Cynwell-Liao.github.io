import { DockIcon } from './DockIcon'

/** A miniature of the Terminal window, badged with its app icon, as macOS shows it. */
export function DockMinimizedWindow() {
  return (
    <span aria-hidden="true" className="desktop-dock__minimized">
      <span className="desktop-dock__thumbnail">
        <span className="desktop-dock__thumbnail-titlebar">
          <span />
          <span />
          <span />
        </span>
        <span className="desktop-dock__thumbnail-screen">
          <span />
          <span />
          <span />
        </span>
      </span>
      <span className="desktop-dock__badge">
        <DockIcon app="terminal" />
      </span>
    </span>
  )
}
