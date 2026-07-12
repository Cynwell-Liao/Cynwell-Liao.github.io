import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { createProject } from '../../../test/factories/portfolio'

import { ProjectsSection } from './ProjectsSection'

const headingProps = {
  headingDescription: 'Deterministic project examples.',
  headingEyebrow: 'Work',
  headingTitle: 'Selected projects',
  liveLabel: 'View live',
  sourceLabel: 'View source',
} as const

describe('ProjectsSection', () => {
  it('labels the section and renders project content as semantic lists', () => {
    render(<ProjectsSection {...headingProps} projects={[createProject()]} />)

    const region = screen.getByRole('region', { name: 'Selected projects' })
    const article = within(region).getByRole('article')

    expect(region).toHaveAttribute('id', 'projects')
    expect(
      screen.getByRole('heading', { level: 2, name: 'Selected projects' })
    ).toHaveAttribute('id', 'projects-heading')
    expect(
      within(article).getByRole('heading', { level: 3, name: 'Example Project' })
    ).toBeInTheDocument()
    expect(
      within(article).getByText('A deterministic project summary.')
    ).toBeInTheDocument()
    expect(within(article).getByText('Validated behavior')).toBeInTheDocument()
    expect(within(article).getByText('TypeScript')).toBeInTheDocument()
  })

  it('gives outbound links project-specific accessible names and safe attributes', () => {
    render(<ProjectsSection {...headingProps} projects={[createProject()]} />)

    const liveLink = screen.getByRole('link', { name: 'View live: Example Project' })
    const sourceLink = screen.getByRole('link', {
      name: 'View source: Example Project',
    })

    expect(liveLink).toHaveAttribute('href', 'https://example.com/project')
    expect(sourceLink).toHaveAttribute('href', 'https://github.com/example/project')
    for (const link of [liveLink, sourceLink]) {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noreferrer')
    }
  })

  it('omits unavailable project actions instead of rendering empty links', () => {
    render(
      <ProjectsSection
        {...headingProps}
        projects={[createProject({ liveUrl: undefined, repoUrl: undefined })]}
      />
    )

    expect(
      screen.queryByRole('link', { name: /Example Project/u })
    ).not.toBeInTheDocument()
  })
})
