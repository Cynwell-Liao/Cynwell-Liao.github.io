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
}
