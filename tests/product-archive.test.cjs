const assert = require('node:assert/strict')
const { afterEach, test } = require('node:test')
const React = require('react')
const { act, create } = require('react-test-renderer')

require('ts-node').register({ transpileOnly: true, compilerOptions: { jsx: 'react-jsx' } })
require.extensions['.scss'] = module => {
  module.exports = {}
}

const replaceModule = (path, exports) => {
  const id = require.resolve(path)
  require.cache[id] = { id, filename: id, loaded: true, exports }
}

replaceModule('next/navigation', { usePathname: () => '/products' })
replaceModule('../src/app/_components/Card', {
  Card: ({ doc }) => React.createElement('article', { 'data-id': doc.id }, doc.title),
})
replaceModule('../src/app/_components/Pagination', {
  Pagination: ({ onClick, totalPages }) =>
    React.createElement(
      'button',
      {
        onClick: () => onClick(Math.min(2, totalPages)),
      },
      'Next page',
    ),
})

const { CollectionArchive } = require('../src/app/_components/CollectionArchive')
const { FilterProvider, useFilter } = require('../src/app/_providers/Filter')
const {
  fetchProductList,
  getLocalResult,
  isCompleteCatalog,
} = require('../src/app/_components/CollectionArchive/results')
const { productList } = require('../src/payload/endpoints/product-list')

const oldProduct = { id: 'old', title: 'Old', createdAt: '2026-01-01', categories: ['phones'] }
const newProduct = { id: 'new', title: 'New', createdAt: '2026-02-01', categories: ['watches'] }
const products = [oldProduct, newProduct]
const resultFor = docs => getLocalResult({ docs, page: 1, limit: 300 })
const responseFor = docs => ({ ok: true, json: async () => resultFor(docs) })
const wrap = docs => docs.map(value => ({ relationTo: 'products', value }))
const originalFetch = global.fetch
let renderer
let filters

const Controls = () => {
  filters = useFilter()
  return null
}
const mount = async overrides => {
  const props = {
    relationTo: 'products',
    populateBy: 'collection',
    limit: 10,
    populatedDocs: wrap(products),
    populatedDocsTotal: 2,
    ...overrides,
  }
  await act(async () => {
    renderer = create(
      React.createElement(
        FilterProvider,
        null,
        React.createElement(Controls),
        React.createElement(CollectionArchive, props),
      ),
    )
  })
}
const visibleIDs = () => renderer.root.findAllByType('article').map(node => node.props['data-id'])

afterEach(async () => {
  if (renderer) await act(async () => renderer.unmount())
  renderer = undefined
  global.fetch = originalFetch
})

test('complete server data sorts and filters immediately without any API calls', async () => {
  let calls = 0
  global.fetch = async () => {
    calls += 1
    throw new Error('Unexpected fetch')
  }
  await mount()
  assert.deepEqual(visibleIDs(), ['new', 'old'])
  await act(async () => filters.setSort('createdAt'))
  assert.deepEqual(visibleIDs(), ['old', 'new'])
  await act(async () => filters.setCategoryFilters(['phones']))
  assert.deepEqual(visibleIDs(), ['old'])
  await act(async () => filters.setCategoryFilters(['phones', 'watches']))
  assert.deepEqual(visibleIDs(), ['old', 'new'])
  assert.equal(calls, 0)
})

test('changing filters resets pagination, including when returning to an earlier filter', async () => {
  await mount({ limit: 1 })
  await act(async () => renderer.root.findByType('button').props.onClick())
  assert.deepEqual(visibleIDs(), ['old'])
  await act(async () => filters.setCategoryFilters(['watches']))
  assert.deepEqual(visibleIDs(), ['new'])
  await act(async () => filters.setCategoryFilters([]))
  assert.deepEqual(visibleIDs(), ['new'])
})

test('filter clicks during catalog loading share one request and use the latest filter', async () => {
  const requests = []
  global.fetch = (url, options) => new Promise(resolve => requests.push({ url, options, resolve }))
  await mount({ populatedDocs: [], populatedDocsTotal: 2 })
  await act(async () => filters.setCategoryFilters(['phones']))
  await act(async () => filters.setCategoryFilters(['watches']))
  assert.equal(requests.length, 1)
  assert.equal(requests[0].options.signal.aborted, false)
  await act(async () => requests[0].resolve(responseFor(products)))
  assert.deepEqual(visibleIDs(), ['new'])
  assert.equal(requests.length, 1)
})

test('large catalogs use pagination and ignore an older response after a filter change', async () => {
  const requests = []
  global.fetch = (url, options) => new Promise(resolve => requests.push({ url, options, resolve }))
  await mount({ populatedDocsTotal: 301 })
  assert.match(requests[0].url, /limit=10/)
  await act(async () => filters.setCategoryFilters(['watches']))
  assert.equal(requests[0].options.signal.aborted, true)
  assert.equal(requests.length, 2)
  await act(async () => requests[1].resolve(responseFor([newProduct])))
  assert.deepEqual(visibleIDs(), ['new'])
  // Simulate a transport that resolves even after abort.
  await act(async () => requests[0].resolve(responseFor([oldProduct])))
  assert.deepEqual(visibleIDs(), ['new'])
})

test('an incomplete prefetch never silently hides products beyond the catalog limit', async () => {
  const requests = []
  global.fetch = (url, options) => new Promise(resolve => requests.push({ url, options, resolve }))
  await mount({ populatedDocs: [], populatedDocsTotal: undefined })
  assert.match(requests[0].url, /limit=300/)
  await act(async () =>
    requests[0].resolve({
      ok: true,
      json: async () => ({ ...resultFor(products), totalDocs: 301, totalPages: 2 }),
    }),
  )
  assert.equal(requests.length, 2)
  assert.match(requests[1].url, /limit=10/)
  await act(async () => requests[1].resolve(responseFor(products)))
  assert.deepEqual(visibleIDs(), ['old', 'new'])
})

test('failed prefetch falls back to the paginated request and reports HTTP errors', async () => {
  let calls = 0
  global.fetch = async () => {
    calls += 1
    return { ok: false, status: 502 }
  }
  await mount({ populatedDocs: [], populatedDocsTotal: 2 })
  assert.equal(calls, 2)
  assert.match(renderer.root.findByProps({ role: 'alert' }).children.join(''), /Unable to load/)
})

test('selection archives preserve the selected order and do not fetch the whole collection', async () => {
  let calls = 0
  global.fetch = async () => {
    calls += 1
    throw new Error('Unexpected fetch')
  }
  await mount({ populateBy: 'selection', selectedDocs: wrap(products) })
  await act(async () => filters.setCategoryFilters(['watches']))
  assert.deepEqual(visibleIDs(), ['old', 'new'])
  assert.equal(calls, 0)
})

test('local category matching respects archive scope and does not mutate input order', () => {
  const result = getLocalResult({
    docs: products,
    categories: ['phones', 'watches'],
    archiveCategories: ['phones'],
    sort: '-createdAt',
    page: 9,
    limit: 10,
  })
  assert.deepEqual(result.docs, [oldProduct])
  assert.equal(result.page, 1)
  assert.deepEqual(
    products.map(doc => doc.id),
    ['old', 'new'],
  )
})

test('only a complete, unique catalog with sorting dates can use local filtering', () => {
  assert.equal(isCompleteCatalog(products, 2), true)
  assert.equal(isCompleteCatalog([], 0), true)
  assert.equal(isCompleteCatalog(products, 301), false)
  assert.equal(isCompleteCatalog([oldProduct, oldProduct], 2), false)
  assert.equal(isCompleteCatalog([{ ...oldProduct, createdAt: undefined }], 1), false)
})

test('malformed successful responses fail instead of leaving the archive silently loading', async () => {
  global.fetch = async () => ({ ok: true, json: async () => ({ error: 'Broken response' }) })
  await assert.rejects(
    fetchProductList('/api/products-list', new AbortController().signal),
    /Invalid product list response/,
  )
})

test('product API bounds queries, combines category scopes, preserves R2 URLs, and reports timings', async () => {
  const calls = []
  const headers = {}
  let body
  const req = {
    query: {
      limit: '9999',
      page: '2.9',
      categories: 'phones,watches',
      archiveCategories: 'phones',
    },
    payload: {
      logger: { error: message => assert.fail(message) },
      find: async options => {
        calls.push(options)
        return options.collection === 'products'
          ? { ...resultFor([{ ...oldProduct, meta: { image: 'photo' } }]), page: 2 }
          : { docs: [{ id: 'photo', url: 'https://images.example.com/photo.png' }] }
      },
    },
  }
  const res = {
    setHeader: (key, value) => {
      headers[key] = value
    },
    status: code => {
      assert.equal(code, 200)
      return res
    },
    json: value => {
      body = value
    },
  }
  await productList(req, res)
  assert.equal(calls[0].limit, 300)
  assert.equal(calls[0].page, 2)
  assert.equal(calls[0].overrideAccess, false)
  assert.deepEqual(calls[0].where, {
    and: [{ categories: { in: ['phones', 'watches'] } }, { categories: { in: ['phones'] } }],
  })
  assert.equal(body.docs[0].meta.image.url, 'https://images.example.com/photo.png')
  assert.equal(headers['Cache-Control'], 'no-store')
  assert.match(headers['Server-Timing'], /products;dur=\d+, media;dur=\d+, total;dur=\d+/)
})
