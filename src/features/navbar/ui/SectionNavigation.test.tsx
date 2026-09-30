import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createNavLink } from '../../../test/factories/portfolio'
import { setMockReducedMotion } from '../../../test/setup'

import { SectionNavigation } from './SectionNavigation'

const links = [
  createNavLink(),
  createNavLink({ href: '#projects', label: 'Projects' }),
] as const

const renderNavigation = () =>
  render(
    <>
      <SectionNavigation links={links} theme="light" />
      <section id="about" />
      <section id="projects" />
    </>
  )

const clickWithoutFollowing = (link: HTMLElement, options: MouseEventInit = {}) => {
  const nativeClick = vi.fn((event: MouseEvent) => {
    // React must leave the anchor's browser behavior intact. Cancel only here,
    // after React's handler, to avoid JSDOM starting a hash navigation.
    expect(event.defaultPrevented).toBe(false)
    event.preventDefault()
  })
  document.addEventListener('click', nativeClick, { once: true })
  fireEvent.click(link, options)
  expect(nativeClick).toHaveBeenCalledOnce()
}

const mockLinkDimensions = (link: HTMLElement, x: number, width: number) => {
  const offsetLeft = vi.fn(() => x)
  const offsetWidth = vi.fn(() => width)
  Object.defineProperties(link, {
    offsetLeft: { configurable: true, get: offsetLeft },
    offsetWidth: { configurable: true, get: offsetWidth },
  })
  return { offsetLeft, offsetWidth }
}

beforeEach(() => {
  vi.useFakeTimers()
  window.history.replaceState({}, '', '/')
})

afterEach(() => {
  vi.useRealTimers()
  window.history.replaceState({}, '', '/')
})

describe('SectionNavigation', () => {
  it('selects an ordinary click while preserving native anchor navigation', () => {
    renderNavigation()
    const about = screen.getByRole('link', { name: 'About' })
    const projects = screen.getByRole('link', { name: 'Projects' })

    clickWithoutFollowing(about)
    expect(about).toHaveAttribute('aria-current', 'location')
    expect(projects).not.toHaveAttribute('aria-current')

    clickWithoutFollowing(projects)
    expect(projects).toHaveAttribute('aria-current', 'location')
    expect(about).not.toHaveAttribute('aria-current')
  })

  it.each([
    { name: 'Control', options: { ctrlKey: true } },
    { name: 'Command', options: { metaKey: true } },
    { name: 'Shift', options: { shiftKey: true } },
    { name: 'Alt', options: { altKey: true } },
    { name: 'middle button', options: { button: 1 } },
  ])('keeps the current section for a $name click', ({ options }) => {
    renderNavigation()
    const about = screen.getByRole('link', { name: 'About' })
    const projects = screen.getByRole('link', { name: 'Projects' })
    clickWithoutFollowing(about)

    clickWithoutFollowing(projects, options)

    expect(about).toHaveAttribute('aria-current', 'location')
    expect(projects).not.toHaveAttribute('aria-current')
  })

  it('keeps selection unchanged when another link is hovered or focused', () => {
    setMockReducedMotion(false)
    renderNavigation()
    const about = screen.getByRole('link', { name: 'About' })
    const projects = screen.getByRole('link', { name: 'Projects' })
    mockLinkDimensions(about, 4, 96)
    clickWithoutFollowing(about)

    fireEvent.mouseEnter(projects)
    act(() => {
      projects.focus()
    })

    expect(projects).toHaveFocus()
    expect(about).toHaveAttribute('aria-current', 'location')
    expect(projects).not.toHaveAttribute('aria-current')
    expect(screen.getByTestId('navbar-indicator')).toBeInTheDocument()
  })

  it('updates selected and inactive label colors when the theme changes', () => {
    const { rerender } = renderNavigation()
    const about = screen.getByRole('link', { name: 'About' })
    const projects = screen.getByRole('link', { name: 'Projects' })
    mockLinkDimensions(about, 4, 96)
    clickWithoutFollowing(about)

    expect(about).toHaveStyle({ color: 'var(--color-white)' })
    expect(projects).toHaveStyle({ color: 'var(--color-slate-700)' })

    rerender(
      <>
        <SectionNavigation links={links} theme="dark" />
        <section id="about" />
        <section id="projects" />
      </>
    )

    expect(about).toHaveAttribute('aria-current', 'location')
    expect(projects).not.toHaveAttribute('aria-current')
    expect(about).toHaveStyle({ color: 'var(--color-slate-900)' })
    expect(projects).toHaveStyle({ color: 'var(--color-slate-200)' })
    expect(screen.getByTestId('navbar-indicator')).toHaveStyle({
      width: '96px',
      transform: 'translateX(4px)',
    })
  })

  it('measures the selected link before showing its decorative indicator', () => {
    renderNavigation()
    const about = screen.getByRole('link', { name: 'About' })
    const projects = screen.getByRole('link', { name: 'Projects' })
    const aboutDimensions = mockLinkDimensions(about, 4, 96)
    const projectDimensions = mockLinkDimensions(projects, 100, 112)

    expect(screen.queryByTestId('navbar-indicator')).not.toBeInTheDocument()
    clickWithoutFollowing(about)

    expect(aboutDimensions.offsetLeft).toHaveBeenCalled()
    expect(aboutDimensions.offsetWidth).toHaveBeenCalled()
    expect(projectDimensions.offsetLeft).not.toHaveBeenCalled()
    expect(screen.getByTestId('navbar-indicator')).toHaveAttribute(
      'aria-hidden',
      'true'
    )
    expect(screen.getByTestId('navbar-indicator')).toHaveStyle({
      width: '96px',
      transform: 'translateX(4px)',
    })

    clickWithoutFollowing(projects)
    expect(projectDimensions.offsetLeft).toHaveBeenCalled()
    expect(projectDimensions.offsetWidth).toHaveBeenCalled()
    expect(screen.getAllByTestId('navbar-indicator')).toHaveLength(1)
    expect(screen.getByTestId('navbar-indicator')).toHaveStyle({
      width: '112px',
      transform: 'translateX(100px)',
    })
  })

  it('resets the indicator at home before selecting another section', () => {
    vi.stubGlobal('scrollY', 900)
    renderNavigation()
    render(<section id="home" />)
    const about = screen.getByRole('link', { name: 'About' })
    const projects = screen.getByRole('link', { name: 'Projects' })
    mockLinkDimensions(about, 4, 96)
    mockLinkDimensions(projects, 100, 112)
    clickWithoutFollowing(projects)
    const previousIndicator = screen.getByTestId('navbar-indicator')

    window.history.replaceState({}, '', '/#home')
    fireEvent(window, new HashChangeEvent('hashchange'))

    expect(about).not.toHaveAttribute('aria-current')
    expect(previousIndicator).not.toBeInTheDocument()

    for (const { href } of links) {
      const section = document.getElementById(href.slice(1))
      if (!section) throw new Error('Section fixture is missing')
      vi.spyOn(section, 'getBoundingClientRect').mockReturnValue(
        new DOMRect(0, 1000, 1000, 1000)
      )
    }
    vi.stubGlobal('scrollY', 0)
    fireEvent.scroll(window)
    act(() => {
      vi.advanceTimersByTime(20)
    })

    expect(projects).not.toHaveAttribute('aria-current')
    expect(screen.queryByTestId('navbar-indicator')).not.toBeInTheDocument()

    clickWithoutFollowing(about)

    expect(about).toHaveAttribute('aria-current', 'location')
    expect(screen.getByTestId('navbar-indicator')).not.toBe(previousIndicator)
    expect(screen.getByTestId('navbar-indicator')).toHaveStyle({
      width: '96px',
      transform: 'translateX(4px)',
    })
  })

  it('waits for measurable links and remeasures them when their layout changes', () => {
    const observers: TestResizeObserver[] = []
    class TestResizeObserver implements ResizeObserver {
      callback: ResizeObserverCallback
      observe = vi.fn()
      unobserve = vi.fn()
      disconnect = vi.fn()

      constructor(callback: ResizeObserverCallback) {
        this.callback = callback
        observers.push(this)
      }
    }
    vi.stubGlobal('ResizeObserver', TestResizeObserver)
    const { unmount } = renderNavigation()
    const navigation = screen.getByRole('navigation', { name: 'Primary navigation' })
    const about = screen.getByRole('link', { name: 'About' })
    const projects = screen.getByRole('link', { name: 'Projects' })
    const dimensions = mockLinkDimensions(about, 4, 0)
    clickWithoutFollowing(about)

    expect(screen.queryByTestId('navbar-indicator')).not.toBeInTheDocument()
    const observer = observers.at(-1)
    if (!observer) throw new Error('Navigation resize observer was not registered')
    expect(observer.observe).toHaveBeenCalledWith(navigation)
    expect(observer.observe).toHaveBeenCalledWith(about)
    expect(observer.observe).toHaveBeenCalledWith(projects)

    dimensions.offsetWidth.mockReturnValue(96)
    act(() => {
      observer.callback([], observer)
    })
    expect(screen.getByTestId('navbar-indicator')).toBeInTheDocument()
    expect(dimensions.offsetLeft).toHaveBeenCalled()
    expect(screen.getByTestId('navbar-indicator')).toHaveStyle({
      width: '96px',
      transform: 'translateX(4px)',
    })

    dimensions.offsetLeft.mockClear().mockReturnValue(8)
    dimensions.offsetWidth.mockClear().mockReturnValue(120)
    act(() => {
      observer.callback([], observer)
    })
    expect(dimensions.offsetLeft).toHaveBeenCalled()
    expect(dimensions.offsetWidth).toHaveBeenCalled()
    expect(screen.getByTestId('navbar-indicator')).toHaveStyle({
      width: '120px',
      transform: 'translateX(8px)',
    })

    unmount()
    expect(observer.disconnect).toHaveBeenCalledOnce()
  })
})
