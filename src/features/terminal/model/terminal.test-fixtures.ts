import type { Project } from '@shared/types/portfolio.types'

import type { TerminalProfile } from './terminal.types'

export const terminalTestProfile: TerminalProfile = {
  name: 'Test Engineer',
  title: 'Software Engineer',
  about: ['Builds reliable systems.', 'Enjoys clear interfaces.'],
  githubUsername: 'test-engineer',
  heroTerminalPath: '~/portfolio',
  heroTerminalDirectories: ['projects', 'skills'],
  heroTerminalPrompt: '_',
}

export const terminalTestProjects: Project[] = [
  {
    id: 'alpha-project',
    title: 'Alpha Project',
    summary: 'The first deterministic test project.',
    highlights: ['Reliable'],
    stack: ['TypeScript'],
    liveUrl: 'https://example.com/alpha',
    repoUrl: 'https://github.com/test-engineer/alpha',
  },
  {
    id: 'beta-project',
    title: 'Beta Project',
    summary: 'The second deterministic test project.',
    highlights: ['Accessible'],
    stack: ['React'],
    repoUrl: 'https://github.com/test-engineer/beta',
  },
]
