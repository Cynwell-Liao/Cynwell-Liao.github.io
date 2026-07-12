import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { createSkillCategory, createSkillItem } from '../../../test/factories/portfolio'

import { TechStackSection } from './TechStackSection'

const headingProps = {
  headingDescription: 'Tools used in deterministic tests.',
  headingEyebrow: 'Tools',
  headingTitle: 'Technology stack',
} as const

describe('TechStackSection', () => {
  it('renders a labelled section with category and skill details', () => {
    const categories = [
      createSkillCategory(),
      createSkillCategory({
        title: 'Infrastructure',
        items: [
          createSkillItem({
            color: undefined,
            icon: 'docker',
            name: 'Docker',
            note: 'Containerized delivery',
          }),
        ],
      }),
    ] as const

    render(<TechStackSection {...headingProps} categories={categories} />)

    const region = screen.getByRole('region', { name: 'Technology stack' })

    expect(region).toHaveAttribute('id', 'tech-stack')
    expect(
      screen.getByRole('heading', { level: 2, name: 'Technology stack' })
    ).toHaveAttribute('id', 'tech-stack-heading')
    expect(
      within(region).getByRole('heading', { level: 3, name: 'Languages' })
    ).toBeInTheDocument()
    expect(
      within(region).getByRole('heading', { level: 3, name: 'Infrastructure' })
    ).toBeInTheDocument()
    expect(
      within(region).getByText('Typed application development')
    ).toBeInTheDocument()
    expect(within(region).getByText('Containerized delivery')).toBeInTheDocument()
  })

  it('keeps registered brand icons decorative while preserving skill text', () => {
    const { container } = render(
      <TechStackSection {...headingProps} categories={[createSkillCategory()]} />
    )

    expect(screen.getByText('TypeScript')).toBeInTheDocument()
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })
})
