import type { Theme } from './types'

export const themeLocalStorageKey = 'payload-theme'

export const defaultTheme: Theme = 'light'

export const getImplicitPreference = (): Theme => 'light'
