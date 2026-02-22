import { education, navLinks, profile, skillCategories } from '@content/profile'
import { loadProjects } from '@content/projects'
import { AboutSection } from '@features/about'
import { EducationSection } from '@features/education'
import { Footer } from '@features/footer'
import { HeroSection } from '@features/hero'
import { Navbar } from '@features/navbar'
import { ProjectsSection } from '@features/projects'
import { ResumeSection } from '@features/resume'
import { TechStackSection } from '@features/tech-stack'
import { useTheme } from '@shared/lib/theme/useTheme'

const projects = loadProjects()

function App() {
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="relative overflow-x-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-[-8rem] -z-10 flex justify-between px-6">
        <div className="h-72 w-72 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="h-72 w-72 rounded-full bg-secondary-500/10 blur-3xl" />
      </div>
      <Navbar
        githubUrl={profile.githubUrl}
        links={navLinks}
        onToggleTheme={toggleTheme}
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
