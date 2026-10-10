import type { ThemeMode } from '@shared/types/common'
import type { ProfileData, Project } from '@shared/types/portfolio.types'

export type TerminalProfile = Pick<
  ProfileData,
  | 'name'
  | 'title'
  | 'about'
  | 'githubUsername'
  | 'heroTerminalPath'
  | 'heroTerminalDirectories'
  | 'heroTerminalPrompt'
>

export interface TerminalWindowProps {
  profile: TerminalProfile
  projects: readonly Project[]
  theme: ThemeMode
  onClose: () => void
  onToggleTheme: () => void
  /**
   * Incrementing this value restores a minimized window and brings it to the
   * front, like clicking a running app in the macOS Dock.
   */
  activationRequest?: number
  /**
   * When provided, an external Dock owns the minimized-window tile, so the
   * built-in fallback restore button is not rendered.
   */
  onMinimizedChange?: (minimized: boolean) => void
  onFullscreenChange?: (fullscreen: boolean) => void
}
