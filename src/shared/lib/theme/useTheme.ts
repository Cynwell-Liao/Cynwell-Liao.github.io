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

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
    storeTheme(theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'dark' ? 'light' : 'dark'))
  }

  return { theme, toggleTheme }
}
