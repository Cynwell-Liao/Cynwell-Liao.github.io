import { domAnimation, LazyMotion, MotionConfig } from 'framer-motion'
import { useCallback, useState } from 'react'

import { education, navLinks, profile, projects, skillCategories } from '@content'
import { AboutSection } from '@features/about'
import { DesktopDock } from '@features/dock'
import { EducationSection } from '@features/education'
import { Footer } from '@features/footer'
import { HeroSection } from '@features/hero'
import { Navbar } from '@features/navbar'
import { ProjectsSection } from '@features/projects'
import { TechStackSection } from '@features/tech-stack'
import { useTheme } from '@shared/lib/theme/useTheme'

import { TerminalHost } from './TerminalHost'

function App() {
  const { theme, toggleTheme } = useTheme()
  const [terminalOpener, setTerminalOpener] = useState<HTMLElement | null>(null)
  const [terminalMinimized, setTerminalMinimized] = useState(false)
  const [terminalFullscreen, setTerminalFullscreen] = useState(false)
  const [terminalActivation, setTerminalActivation] = useState(0)
  const activateTerminal = useCallback(() => {
    setTerminalMinimized(false)
    setTerminalActivation((current) => current + 1)
  }, [])
  const openTerminal = useCallback(
    (opener: HTMLButtonElement) => {
      // A running Terminal keeps the launcher that opened it for focus return.
      setTerminalOpener((current) => current ?? opener)
      activateTerminal()
    },
    [activateTerminal]
  )
  const closeTerminal = useCallback(() => {
    setTerminalOpener(null)
    setTerminalMinimized(false)
    setTerminalFullscreen(false)
  }, [])

  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
        <div className="relative overflow-x-clip">
          <a
            className="fixed top-3 left-3 z-[100] -translate-y-20 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:ring-offset-2 dark:bg-white dark:text-slate-950"
            href="#main-content"
          >
            Skip to main content
          </a>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-[-8rem] -z-10 flex justify-between px-6"
          >
            <div className="h-72 w-72 rounded-full bg-accent-500/20 blur-3xl" />
            <div className="h-72 w-72 rounded-full bg-secondary-500/10 blur-3xl" />
          </div>
          <Navbar
            brandName={profile.brandName}
            links={navLinks}
            onOpenTerminal={openTerminal}
            onToggleTheme={toggleTheme}
            theme={theme}
          />
          <main id="main-content" tabIndex={-1}>
            <HeroSection
              deployVersion={import.meta.env.VITE_APP_VERSION}
              profile={profile}
            />
            <AboutSection
              headingAccent={profile.aboutHeadingAccent}
              headingLead={profile.aboutHeadingLead}
              intro={profile.aboutIntro}
              paragraphs={profile.about}
            />
            <TechStackSection
              categories={skillCategories}
              headingDescription={profile.techStackSectionDescription}
              headingEyebrow={profile.techStackSectionEyebrow}
              headingTitle={profile.techStackSectionTitle}
            />
            <ProjectsSection
              headingDescription={profile.projectsSectionDescription}
              headingEyebrow={profile.projectsSectionEyebrow}
              headingTitle={profile.projectsSectionTitle}
              liveLabel={profile.projectLiveLabel}
              projects={projects}
              sourceLabel={profile.projectSourceLabel}
            />
            <EducationSection
              education={education}
              headingDescription={profile.educationSectionDescription}
              headingEyebrow={profile.educationSectionEyebrow}
              headingTitle={profile.educationSectionTitle}
            />
          </main>
          <Footer
            attribution={profile.footerAttribution}
            name={profile.name}
            repositoryUrl={profile.repositoryUrl}
          />
          <DesktopDock
            fullscreen={terminalFullscreen}
            githubUrl={profile.githubUrl}
            linkedinUrl={profile.linkedinUrl}
            terminalMinimized={terminalMinimized}
            terminalOpen={terminalOpener !== null}
            onOpenTerminal={openTerminal}
            onRestoreTerminal={activateTerminal}
          />
          {terminalOpener ? (
            <TerminalHost
              activationRequest={terminalActivation}
              opener={terminalOpener}
              onClose={closeTerminal}
              onMinimizedChange={setTerminalMinimized}
              onFullscreenChange={setTerminalFullscreen}
              onToggleTheme={toggleTheme}
              profile={profile}
              projects={projects}
              theme={theme}
            />
          ) : null}
        </div>
      </MotionConfig>
    </LazyMotion>
  )
}

export default App
