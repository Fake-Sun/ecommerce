'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'

import canUseDOM from '../../_utilities/canUseDOM'
import { defaultTheme, themeLocalStorageKey } from './shared'
import { Theme, ThemeContextType } from './types'

const initialContext: ThemeContextType = {
  theme: defaultTheme,
  setTheme: () => null,
}

const ThemeContext = createContext(initialContext)

export const ThemeProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(canUseDOM ? defaultTheme : defaultTheme)

  const setTheme = useCallback(() => {
    setThemeState(defaultTheme)
    if (canUseDOM) {
      window.localStorage.setItem(themeLocalStorageKey, defaultTheme)
      document.documentElement.setAttribute('data-theme', defaultTheme)
    }
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', defaultTheme)
    window.localStorage.setItem(themeLocalStorageKey, defaultTheme)
    setThemeState(defaultTheme)
  }, [])

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export const useTheme = (): ThemeContextType => useContext(ThemeContext)
