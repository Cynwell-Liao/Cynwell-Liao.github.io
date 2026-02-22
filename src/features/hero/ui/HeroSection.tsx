import { motion } from 'framer-motion'
import { type FormEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react'
import { FiGithub, FiTerminal } from 'react-icons/fi'
import { SiLinkedin } from 'react-icons/si'

import type { ProfileData } from '../model/profile.types'
import type { ThemeMode } from '@shared/types/common'
import type { Project } from '@shared/types/portfolio.types'

interface HeroSectionProps {
  profile: ProfileData
  projects: Project[]
  theme: ThemeMode
  onToggleTheme: () => void
}

interface GithubContributionsResponse {
  totalContributions?: unknown
}

type TerminalTone = 'default' | 'accent' | 'error' | 'success' | 'muted'

interface TerminalLine {
  text: string
  tone?: TerminalTone
}

const parseContributionTotal = (value: unknown): number | null => {
  if (typeof value !== 'object' || value === null) {
    return null
  }

  const payload = value as GithubContributionsResponse

  return typeof payload.totalContributions === 'number'
    ? payload.totalContributions
    : null
}

const terminalToneClasses: Record<TerminalTone, string> = {
  default: 'text-slate-600 dark:text-slate-300',
  accent: 'text-accent-600 dark:text-accent-400',
  error: 'text-rose-600 dark:text-rose-400',
  success: 'text-emerald-600 dark:text-emerald-400',
  muted: 'text-slate-500 dark:text-slate-400',
}

const createInitialTerminalLines = (profile: ProfileData): TerminalLine[] => [
  { text: "Type 'help' to explore commands.", tone: 'muted' },
  { text: `${profile.heroTerminalPath} $ ls -la`, tone: 'accent' },
  ...profile.heroTerminalDirectories.map((directory) => ({
    text: `drwxr-xr-x ${directory}`,
  })),
]

export function HeroSection({
  profile,
  projects,
  theme,
  onToggleTheme,
}: HeroSectionProps) {
  const [contributions, setContributions] = useState<number | null>(null)
  const [terminalInput, setTerminalInput] = useState('')
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>(() =>
    createInitialTerminalLines(profile)
  )
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const terminalOutputRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`https://github-contributions-api.deno.dev/${profile.githubUsername}.json`)
      .then((res) => res.json())
      .then((data: unknown) => {
        const totalContributions = parseContributionTotal(data)

        if (totalContributions !== null) {
          setContributions(totalContributions)
        }
      })
      .catch(console.error)
  }, [profile.githubUsername])

  useEffect(() => {
    if (terminalOutputRef.current) {
      terminalOutputRef.current.scrollTop = terminalOutputRef.current.scrollHeight
    }
  }, [terminalLines])

  const pushTerminalOutput = (input: string, output: TerminalLine[]) => {
    setTerminalLines((previousLines) => [
      ...previousLines,
      { text: `${profile.heroTerminalPath} $ ${input}`, tone: 'accent' },
      ...output,
    ])
  }

  const openProjectLink = (token: string): TerminalLine[] => {
    const normalizedToken = token.toLowerCase()
    const index = Number.parseInt(normalizedToken, 10)

    const selectedProject =
      Number.isInteger(index) && index >= 1 && index <= projects.length
        ? projects[index - 1]
        : projects.find((project) => project.id.toLowerCase() === normalizedToken)

    if (!selectedProject) {
      return [
        {
          text: `Project '${token}' not found. Use 'projects' to list available entries.`,
          tone: 'error',
        },
      ]
    }

    const targetUrl = selectedProject.liveUrl ?? selectedProject.repoUrl
    if (!targetUrl) {
      return [
        {
          text: `Project '${selectedProject.id}' has no configured link to open.`,
          tone: 'error',
        },
      ]
    }

    window.open(targetUrl, '_blank', 'noopener,noreferrer')
    return [{ text: `Opening ${selectedProject.title}...`, tone: 'success' }]
  }

  const resolveThemeOutput = (target: string): TerminalLine[] => {
    if (target === 'toggle') {
      onToggleTheme()
      return [
        {
          text: `Theme toggled to ${theme === 'dark' ? 'light' : 'dark'}.`,
          tone: 'success',
        },
      ]
    }

    if (target !== 'dark' && target !== 'light') {
      return [
        {
          text: 'Usage: theme <dark|light|toggle>',
          tone: 'error',
        },
      ]
    }

    if (target === theme) {
      return [{ text: `Theme already set to ${theme}.`, tone: 'muted' }]
    }

    onToggleTheme()
    return [{ text: `Theme set to ${target}.`, tone: 'success' }]
  }

  const runCommand = (rawInput: string) => {
    const input = rawInput.trim()
    if (!input) {
      return
    }

    const nextCommandHistory = [...commandHistory, input]
    setCommandHistory(nextCommandHistory)

    const [command, ...args] = input.split(/\s+/)
    const normalizedCommand = command.toLowerCase()

    if (normalizedCommand === 'clear') {
      setTerminalLines([])
      return
    }

    switch (normalizedCommand) {
      case 'help':
        pushTerminalOutput(input, [
          { text: 'Available commands:' },
          { text: 'help, ls, pwd, whoami, cat about.txt', tone: 'muted' },
          {
            text: 'projects, open <id|index>, theme <dark|light|toggle>',
            tone: 'muted',
          },
          { text: 'history, clear', tone: 'muted' },
        ])
        return
      case 'ls':
        pushTerminalOutput(input, [
          ...profile.heroTerminalDirectories.map((directory) => ({
            text: `drwxr-xr-x ${directory}`,
          })),
          { text: '-rw-r--r-- about.txt' },
        ])
        return
      case 'pwd':
        pushTerminalOutput(input, [{ text: profile.heroTerminalPath }])
        return
      case 'whoami':
        pushTerminalOutput(input, [{ text: `${profile.name} (${profile.title})` }])
        return
      case 'cat':
        if (args[0]?.toLowerCase() === 'about.txt') {
          pushTerminalOutput(
            input,
            profile.about.map((line) => ({ text: `- ${line}` }))
          )
          return
        }
        pushTerminalOutput(input, [
          { text: "Only 'cat about.txt' is supported.", tone: 'error' },
        ])
        return
      case 'projects':
        pushTerminalOutput(
          input,
          projects.map((project, index) => ({
            text: `[${String(index + 1)}] ${project.id} - ${project.title}`,
          }))
        )
        return
      case 'open':
        if (!args[0]) {
          pushTerminalOutput(input, [{ text: 'Usage: open <id|index>', tone: 'error' }])
          return
        }
        pushTerminalOutput(input, openProjectLink(args[0]))
        return
      case 'theme':
        if (!args[0]) {
          pushTerminalOutput(input, [
            { text: `Current theme: ${theme}` },
            { text: 'Usage: theme <dark|light|toggle>', tone: 'muted' },
          ])
          return
        }
        pushTerminalOutput(input, resolveThemeOutput(args[0].toLowerCase()))
        return
      case 'history':
        pushTerminalOutput(
          input,
          nextCommandHistory.map((previousCommand, index) => ({
            text: `${String(index + 1)}  ${previousCommand}`,
            tone: 'muted',
          }))
        )
        return
      default:
        pushTerminalOutput(input, [
          { text: `Command not found: ${command}`, tone: 'error' },
          { text: "Try 'help' for available commands.", tone: 'muted' },
        ])
    }
  }

  const onTerminalSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    runCommand(terminalInput)
    setTerminalInput('')
  }

  const onTerminalInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') {
      return
    }

    event.preventDefault()
    runCommand(terminalInput)
    setTerminalInput('')
  }

  return (
    <section
      className="relative flex min-h-screen items-center justify-center overflow-hidden pt-28 pb-12 sm:pt-24 lg:pt-0"
      id="home"
    >
      {/* Background Animated Orbs */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-500/15 rounded-full mix-blend-screen filter blur-[100px] animate-blob" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-secondary-500/15 rounded-full mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000" />
      </div>

      <div className="section-wrap relative z-10 grid w-full gap-8 lg:grid-cols-12 lg:gap-10">
        {/* Main Content Area */}
        <motion.div
          className="lg:col-span-7 flex flex-col justify-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-300 dark:border-white/20 bg-slate-100/50 dark:bg-white/5 px-4 py-1.5 text-xs font-mono tracking-widest text-emerald-500 dark:text-emerald-400 backdrop-blur-md mb-8 w-fit shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            {profile.heroStatusLabel}
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-7xl lg:text-[5.5rem] leading-[1.1]">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-600 via-secondary-500 to-purple-600 dark:from-accent-400 dark:via-secondary-300 dark:to-purple-400">
              {profile.title}s
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600 dark:text-slate-300 font-light">
            {profile.name} — {profile.tagline}
          </p>

          <div className="mt-10 flex flex-wrap gap-5">
            <a
              className="group relative inline-flex items-center gap-3 rounded-full bg-white px-8 py-4 text-sm font-semibold text-slate-900 transition-all hover:scale-105 hover:shadow-glow"
              href={profile.linkedinUrl}
              rel="noreferrer"
              target="_blank"
            >
              <SiLinkedin className="h-5 w-5 text-[#0A66C2]" />
              {profile.linkedinLabel}
            </a>

            <a
              className="inline-flex items-center gap-3 rounded-full border border-slate-300 dark:border-white/20 bg-slate-100/50 dark:bg-white/5 px-8 py-4 text-sm font-semibold text-slate-800 dark:text-white backdrop-blur-md transition-all hover:bg-slate-200/50 dark:hover:bg-white/10 hover:border-slate-400 dark:hover:border-white/40"
              href={profile.githubUrl}
              rel="noreferrer"
              target="_blank"
            >
              <FiGithub className="h-5 w-5" />
              {profile.githubLabel}
            </a>
          </div>
        </motion.div>

        {/* Bento Box Right Side */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-4">
          {/* Main Terminal Box */}
          <motion.div
            className="col-span-2 glass-panel p-6 flex flex-col justify-between min-h-[220px]"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg-green-500/80" />
              </div>
              <FiTerminal className="text-slate-500 dark:text-slate-400" />
            </div>
            <div
              className="font-mono text-sm leading-relaxed text-slate-600 dark:text-slate-300 mt-2 h-[140px] overflow-y-auto pr-1"
              ref={terminalOutputRef}
            >
              {terminalLines.map((line, index) => {
                const tone = line.tone ?? 'default'

                return (
                  <div
                    className={terminalToneClasses[tone]}
                    key={`${line.text}-${String(index)}`}
                  >
                    {line.text}
                  </div>
                )
              })}

              <form
                className="mt-2 flex items-center gap-2"
                onSubmit={onTerminalSubmit}
              >
                <label className="sr-only" htmlFor="hero-terminal-input">
                  Terminal command input
                </label>
                <span className="text-accent-600 dark:text-accent-400">
                  {profile.heroTerminalPath}
                </span>
                <span>$</span>
                <input
                  aria-label="Terminal command input"
                  autoComplete="off"
                  className="min-w-0 flex-1 bg-transparent text-slate-700 outline-none placeholder:text-slate-400 dark:text-slate-200 dark:placeholder:text-slate-500"
                  id="hero-terminal-input"
                  onKeyDown={onTerminalInputKeyDown}
                  onChange={(event) => {
                    setTerminalInput(event.target.value)
                  }}
                  placeholder="help"
                  spellCheck={false}
                  type="text"
                  value={terminalInput}
                />
                <span
                  aria-hidden
                  className="animate-pulse text-accent-600 dark:text-accent-400"
                >
                  {profile.heroTerminalPrompt}
                </span>
              </form>
            </div>
          </motion.div>

          {/* GitHub Contributions Box */}
          <motion.div
            className="col-span-2 glass-panel p-6 relative overflow-hidden group flex flex-col justify-center items-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-secondary-500/10 rounded-full blur-[80px] transition-opacity duration-500 opacity-0 group-hover:opacity-100" />

            <div className="w-full max-w-[800px] mb-4 relative z-10">
              <h2
                id="js-contribution-activity-description"
                className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2"
                tabIndex={-1}
              >
                <FiGithub className="w-4 h-4" />
                {contributions !== null ? (
                  <>
                    <span className="font-bold text-lg text-accent-600 dark:text-accent-400">
                      {contributions}
                    </span>
                    <span>{profile.contributionsSuffixLabel}</span>
                  </>
                ) : (
                  profile.contributionsLoadingLabel
                )}
              </h2>
            </div>

            {/* Using ghchart to render contribution graph with default GitHub colors */}
            <img
              alt={`${profile.name}'s Github chart`}
              className="w-full max-w-[800px] object-cover dark:invert dark:hue-rotate-[180deg] opacity-90 dark:opacity-80 relative z-10"
              src={`https://ghchart.rshah.org/${profile.githubUsername}`}
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
