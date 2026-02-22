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
        brandName={profile.brandName}
        githubLabel={profile.githubLabel}
        githubUrl={profile.githubUrl}
        links={navLinks}
        onToggleTheme={toggleTheme}
        theme={theme}
      />
      <main>
        <HeroSection
          onToggleTheme={toggleTheme}
          profile={profile}
          projects={projects}
          theme={theme}
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
        <ResumeSection
          description={profile.resumeDescription}
          downloadLabel={profile.resumeDownloadLabel}
          headingAccent={profile.resumeHeadingAccent}
          headingLead={profile.resumeHeadingLead}
          openLabel={profile.resumeOpenLabel}
          resumePath={profile.resumePath}
        />
      </main>
      <Footer
        attribution={profile.footerAttribution}
        githubUrl={profile.githubUrl}
        name={profile.name}
      />
    </div>
  )
}

export default App
