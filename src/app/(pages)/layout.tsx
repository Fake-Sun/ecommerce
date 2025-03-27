import React from 'react'

export default function PagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Optional: add section-specific headers/footers here */}
      {children}
    </>
  )
}
