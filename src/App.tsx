import { useEffect, useState } from 'react'
import { AboutSection } from './components/AboutSection'
import { EducationSection } from './components/EducationSection'
import { Footer } from './components/Footer'
import { HeroSection } from './components/HeroSection'
import { Navbar } from './components/Navbar'
import { ProjectsSection } from './components/ProjectsSection'
import { ResumeSection } from './components/ResumeSection'
import { TechStackSection } from './components/TechStackSection'
import projectsData from './data/projects.json'
import { navLinks, profile, skillCategories, education } from './data/profile'
import type { Project, ThemeMode } from './types/portfolio'

const THEME_STORAGE_KEY = 'portfolio-theme'

const getInitialTheme = (): ThemeMode => {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

function App() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme)
  const projects: Project[] = projectsData

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  return (
    <div className="relative overflow-x-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-[-8rem] -z-10 flex justify-between px-6">
        <div className="h-72 w-72 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="h-72 w-72 rounded-full bg-secondary-500/10 blur-3xl" />
      </div>
      <Navbar
        githubUrl={profile.githubUrl}
        links={navLinks}
        onToggleTheme={() =>
          setTheme((currentTheme) =>
            currentTheme === 'dark' ? 'light' : 'dark',
          )
        }
        theme={theme}
      />
      <main>
        <HeroSection profile={profile} />
        <AboutSection paragraphs={profile.about} />
        <TechStackSection categories={skillCategories} />
        <ProjectsSection projects={projects} />
        <EducationSection education={education} />
        <ResumeSection resumePath={profile.resumePath} />
      </main>
      <Footer githubUrl={profile.githubUrl} name={profile.name} />
    </div>
  )
}

export default App
