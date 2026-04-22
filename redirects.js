const serverURL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_SERVER_URL || ''
const siteURL = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_SERVER_URL || ''

module.exports = async () => {
  const internetExplorerRedirect = {
    source: '/:path((?!ie-incompatible.html$).*)',
    has: [
      {
        type: 'header',
        key: 'user-agent',
        value: '(.*Trident.*)',
      },
    ],
    permanent: false,
    destination: '/ie-incompatible.html',
  }

  try {
    const redirectsRes = await fetch(`${serverURL}/api/redirects?limit=1000&depth=1`)
    const redirectsData = await redirectsRes.json()
    const { docs } = redirectsData

    let dynamicRedirects = []

    if (docs) {
      docs.forEach(doc => {
        const { from, to: { type, url, reference } = {} } = doc

        let source = from.replace(siteURL, '').split('?')[0].toLowerCase()

        if (source.endsWith('/')) source = source.slice(0, -1)

        let destination = '/'

        if (type === 'custom' && url) {
          destination = url.replace(siteURL, '')
        }

        if (
          type === 'reference' &&
          typeof reference.value === 'object' &&
          reference?.value?._status === 'published'
        ) {
          destination = `${siteURL}/${
            reference.relationTo !== 'pages' ? `${reference.relationTo}/` : ''
          }${reference.value.slug}`
        }

        const redirect = {
          source,
          destination,
          permanent: true,
        }

        if (source.startsWith('/') && destination && source !== destination) {
          return dynamicRedirects.push(redirect)
        }
      })
    }

    return [internetExplorerRedirect, ...dynamicRedirects]
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      console.error(`Error configuring redirects: ${error}`)
    }

    return []
  }
}
