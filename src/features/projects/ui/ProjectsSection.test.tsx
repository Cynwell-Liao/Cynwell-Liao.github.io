import { fireEvent, render, screen, within } from '@testing-library/react'
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
  })

  it('renders an optional project logo beside the project title', () => {
    render(
      <ProjectsSection
        {...headingProps}
        projects={[
          createProject({
            logoUrl: 'https://example.com/project-logo.png',
            title: 'ParkPie',
          }),
        ]}
      />
    )

    const article = screen.getByRole('article')
    const heading = within(article).getByRole('heading', { level: 3, name: 'ParkPie' })
    const logo = article.querySelector('img')

    expect(heading).toBeInTheDocument()
    expect(logo).toHaveAttribute('src', 'https://example.com/project-logo.png')
    expect(article).toHaveStyle({
      '--brand-color': '#123ABC',
    })
    expect(within(article).getByText('Validated behavior')).toBeInTheDocument()
    expect(within(article).getByText('TypeScript')).toBeInTheDocument()
  })

  it('omits a project logo when no URL is configured', () => {
    const { container } = render(
      <ProjectsSection
        {...headingProps}
        projects={[createProject({ logoUrl: undefined })]}
      />
    )

    expect(container.querySelector('img')).not.toBeInTheDocument()
  })

  it('uses the fallback brand color and hides a logo after loading fails', () => {
    const { container } = render(
      <ProjectsSection
        {...headingProps}
        projects={[
          createProject({
            logoColor: undefined,
            logoUrl: 'https://example.com/broken-logo.png',
          }),
        ]}
      />
    )

    const article = screen.getByRole('article')
    const logo = container.querySelector('img')

    expect(logo).not.toBeNull()
    fireEvent.error(logo as HTMLImageElement)
    expect(container.querySelector('img')).not.toBeInTheDocument()
    expect(article).not.toHaveStyle({
      '--brand-color': '#123ABC',
    })
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

  it('keeps each project and its available actions in content order', () => {
    render(
      <ProjectsSection
        {...headingProps}
        projects={[
          createProject({ id: 'live-only', title: 'Live only', repoUrl: undefined }),
          createProject({
            id: 'source-only',
            title: 'Source only',
            liveUrl: undefined,
          }),
        ]}
      />
    )

    const articles = screen.getAllByRole('article')

    expect(articles).toHaveLength(2)
    expect(within(articles[0]).getByRole('heading', { level: 3 })).toHaveTextContent(
      'Live only'
    )
    expect(within(articles[1]).getByRole('heading', { level: 3 })).toHaveTextContent(
      'Source only'
    )
    expect(within(articles[0]).getAllByRole('link')).toHaveLength(1)
    expect(within(articles[1]).getAllByRole('link')).toHaveLength(1)
    expect(
      within(articles[0]).getByRole('link', { name: 'View live: Live only' })
    ).toHaveAttribute('title', 'View live: Live only')
    expect(
      within(articles[1]).getByRole('link', { name: 'View source: Source only' })
    ).toHaveAttribute('title', 'View source: Source only')
  })
})
