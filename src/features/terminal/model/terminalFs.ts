import type { SkillCategory } from '@shared/types/portfolio.types'

import type { TerminalContent } from './terminal.types'

interface Directory {
  kind: 'directory'
  entries: ReadonlyMap<string, Entry>
  url?: string | undefined
}

interface File {
  kind: 'file'
  lines: readonly string[]
  url?: string
}

type Entry = Directory | File

export const HOME_PATH = '/portfolio'

const directory = (
  entries: readonly (readonly [string, Entry])[],
  url?: string
): Directory => ({
  kind: 'directory',
  entries: new Map(entries),
  url,
})
const file = (lines: readonly string[]): File => ({ kind: 'file', lines })
const link = (url: string): File => ({ kind: 'file', lines: [url], url })

const categoryLines = ({ title, items }: SkillCategory): string[] => [
  title,
  ...items.map(({ name, note }) => `  ${name} — ${note}`),
]

export const skillLines = ({ skillCategories = [] }: TerminalContent): string[] =>
  skillCategories.flatMap(categoryLines)

export function createTerminalFs(content: TerminalContent): Directory {
  const { profile, projects, education = [], skillCategories = [] } = content
  return directory([
    [
      'portfolio',
      directory([
        [
          'README.md',
          file([
            `# ${profile.name} · ${profile.title}`,
            '',
            'This is a read-only portfolio shell.',
            'Try ls, cat about.md, cd projects, or man open.',
          ]),
        ],
        [
          'about.md',
          file(
            profile.about.flatMap((paragraph, index) =>
              index ? ['', paragraph] : [paragraph]
            )
          ),
        ],
        [
          'education.md',
          file(
            education.flatMap(
              ({ institution, degree, duration, location, achievements }) => [
                `## ${institution}`,
                `${degree} · ${duration}${location ? ` · ${location}` : ''}`,
                ...achievements.map((achievement) => `- ${achievement}`),
                '',
              ]
            )
          ),
        ],
        [
          'skills',
          directory([
            ['README.md', file(skillLines(content))],
            ...skillCategories.map(
              (category) =>
                [
                  `${encodeURIComponent(category.title.toLowerCase())}.md`,
                  file(categoryLines(category)),
                ] as const
            ),
          ]),
        ],
        [
          'projects',
          directory(
            projects.map((project) => [
              project.id,
              directory(
                [
                  [
                    'README.md',
                    file([
                      `# ${project.title}`,
                      '',
                      project.summary,
                      '',
                      ...project.highlights.map((highlight) => `- ${highlight}`),
                      '',
                      `Stack: ${project.stack.join(', ')}`,
                    ]),
                  ],
                  ...(project.liveUrl
                    ? [['live', link(project.liveUrl)] as const]
                    : []),
                  ...(project.repoUrl
                    ? [['source', link(project.repoUrl)] as const]
                    : []),
                ],
                project.liveUrl ?? project.repoUrl
              ),
            ])
          ),
        ],
        [
          'links',
          directory([
            ['github', link(profile.githubUrl)],
            ['linkedin', link(profile.linkedinUrl)],
            ['source', link(profile.repositoryUrl)],
          ]),
        ],
      ]),
    ],
  ])
}

type PathResult =
  | { ok: true; entry: Entry; path: string; error?: never }
  | { ok: false; entry?: never; error: string }

export function resolvePath(root: Directory, cwd: string, operand: string): PathResult {
  const expanded =
    operand === '~' || operand.startsWith('~/') ? HOME_PATH + operand.slice(1) : operand
  const absolute = expanded.startsWith('/') ? expanded : `${cwd}/${expanded}`
  const stack: { name: string; entry: Entry }[] = [{ name: '', entry: root }]
  for (const segment of absolute.slice(1).split('/')) {
    const current = stack.at(-1)?.entry
    if (current?.kind !== 'directory') return { ok: false, error: 'Not a directory' }
    if (!segment || segment === '.') continue
    if (segment === '..') {
      if (stack.length > 1) stack.pop()
      continue
    }
    // Preserve the original about.txt shortcut without listing two copies.
    const name = stack.length === 2 && segment === 'about.txt' ? 'about.md' : segment
    const entry = current.entries.get(name)
    if (!entry) return { ok: false, error: 'No such file or directory' }
    stack.push({ name, entry })
  }
  return {
    ok: true,
    entry: stack.at(-1)?.entry ?? root,
    path: stack.map(({ name }) => name).join('/') || '/',
  }
}

export function listEntries(entry: Entry, label: string, all: boolean, long: boolean) {
  const entries =
    entry.kind === 'directory'
      ? [
          ...(all
            ? ([
                ['.', entry],
                ['..', entry],
              ] as const)
            : []),
          ...[...entry.entries].sort(([a], [b]) => a.localeCompare(b)),
        ]
      : [[label, entry] as const]
  return entries.map(([name, item]) => {
    const directoryEntry = item.kind === 'directory'
    const size = directoryEntry
      ? '-'
      : String(new TextEncoder().encode(item.lines.join('\n')).length)
    const display = name + (directoryEntry ? '/' : '')
    // Virtual entries have no real timestamps or disk allocation.
    return long
      ? `${directoryEntry ? 'dr-xr-xr-x' : '-r--r--r--'}  portfolio  ${size.padStart(5)}  ${display}`
      : display
  })
}

export function completePath(
  root: Directory,
  cwd: string,
  prefix: string,
  directoriesOnly: boolean
) {
  if (prefix === '~') return ['~/']
  const slash = prefix.lastIndexOf('/')
  const base = prefix.slice(0, slash + 1)
  const partial = prefix.slice(slash + 1)
  const parent = resolvePath(root, cwd, base || '.')
  if (parent.entry?.kind !== 'directory') return []
  return [...parent.entry.entries]
    .flatMap(([name, entry]) =>
      name.startsWith(partial) && (!directoriesOnly || entry.kind === 'directory')
        ? [`${base}${name}${entry.kind === 'directory' ? '/' : ''}`]
        : []
    )
    .sort()
}
