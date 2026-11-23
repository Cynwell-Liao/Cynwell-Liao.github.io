import { useEffect, useState } from 'react'

import type { ThemeMode } from '@shared/types/common'

const THEME_STORAGE_KEY = 'portfolio-theme'

const readStoredTheme = (): ThemeMode | null => {
  try {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)

    return savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : null
  } catch {
    return null
  }
}

const getSystemTheme = (): ThemeMode =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

export const getInitialTheme = (): ThemeMode => {
  const savedTheme = readStoredTheme()
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme
  }

  return getSystemTheme()
}

const storeTheme = (theme: ThemeMode) => {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Storage can be unavailable in privacy-restricted browsing contexts.
  }
}

export const useTheme = () => {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme)
  const [followsSystem, setFollowsSystem] = useState(() => readStoredTheme() === null)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#020617' : '#f8fafc')
  }, [theme])

  useEffect(() => {
    if (!followsSystem) return

    const preference = window.matchMedia('(prefers-color-scheme: dark)')
    const syncSystemTheme = () => {
      setTheme(preference.matches ? 'dark' : 'light')
    }
    preference.addEventListener('change', syncSystemTheme)
    return () => {
      preference.removeEventListener('change', syncSystemTheme)
    }
  }, [followsSystem])

  const toggleTheme = () => {
    setFollowsSystem(false)
    setTheme((currentTheme) => {
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark'
      storeTheme(nextTheme)
      return nextTheme
    })
  }

  return { theme, toggleTheme }
}
