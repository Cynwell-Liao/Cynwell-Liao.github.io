import type { ThemeMode } from '@shared/types/common'
import type {
  EducationItem,
  ProfileData,
  Project,
  SkillCategory,
} from '@shared/types/portfolio.types'

export type TerminalProfile = Pick<
  ProfileData,
  | 'name'
  | 'title'
  | 'about'
  | 'githubUsername'
  | 'githubUrl'
  | 'linkedinUrl'
  | 'repositoryUrl'
>

export interface TerminalContent {
  profile: TerminalProfile
  projects: readonly Project[]
  education?: readonly EducationItem[]
  skillCategories?: readonly SkillCategory[]
  version?: string | undefined
}

export interface TerminalWindowProps extends TerminalContent {
  theme: ThemeMode
  onClose: () => void
  onToggleTheme: () => void
  onSetTheme?: (theme: ThemeMode) => void
  onFollowSystemTheme?: () => void
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
