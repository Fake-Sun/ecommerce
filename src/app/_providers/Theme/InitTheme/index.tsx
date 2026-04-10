import Script from 'next/script'

import { defaultTheme, themeLocalStorageKey } from '../ThemeSelector/types'

export const InitTheme: React.FC = () => {
  return (
    <Script
      id="theme-script"
      strategy="beforeInteractive"
      dangerouslySetInnerHTML={{
        __html: `
  (function () {
    var themeToSet = '${defaultTheme}'
    window.localStorage.setItem('${themeLocalStorageKey}', themeToSet)
    document.documentElement.setAttribute('data-theme', themeToSet)
  })();
  `,
      }}
    />
  )
}
