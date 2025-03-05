'use client'

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
  useRef,
  useState,
} from 'react'
import { useDebouncedCallback } from 'use-debounce'

import { Product, User } from '../../../payload/payload-types'
import { useAuth } from '../Auth'
import { CartItem, cartReducer } from './reducer'

export type CartContext = {
  cart: User['cart']
  addItemToCart: (item: CartItem) => void
  deleteItemFromCart: (product: Product) => void
  cartIsEmpty: boolean | undefined
  clearCart: () => void
  isProductInCart: (product: Product) => boolean
  cartTotal: {
    formatted: string
    raw: number
  }
  hasInitializedCart: boolean
}

const Context = createContext({} as CartContext)

export const useCart = () => useContext(Context)

const arrayHasItems = array => Array.isArray(array) && array.length > 0

export const CartProvider = props => {
  const { children } = props
  const { user, status: authStatus } = useAuth()

  const [cart, dispatchCart] = useReducer(cartReducer, {
    items: [],
  })

  const [total, setTotal] = useState<{
    formatted: string
    raw: number
  }>({
    formatted: '0.00',
    raw: 0,
  })

  const hasInitialized = useRef(false)
  const [hasInitializedCart, setHasInitialized] = useState(false)

  // ✅ Load cart from localStorage and hydrate state
  useEffect(() => {
    if (!hasInitialized.current) {
      hasInitialized.current = true

      const syncCartFromLocalStorage = async () => {
        const localCart = localStorage.getItem('cart')
        const parsedCart = JSON.parse(localCart || '{}')

        if (parsedCart?.items && parsedCart?.items?.length > 0) {
          const initialCart = await Promise.all(
            parsedCart.items.map(async ({ product, quantity }) => {
              const res = await fetch(
                `${process.env.NEXT_PUBLIC_SERVER_URL}/api/products/${product}`
              )
              const data = await res.json()
              return {
                product: data,
                quantity,
              }
            })
          )

          dispatchCart({
            type: 'SET_CART',
            payload: {
              items: initialCart,
            },
          })
        } else {
          dispatchCart({
            type: 'SET_CART',
            payload: {
              items: [],
            },
          })
        }
      }

      syncCartFromLocalStorage()
    }
  }, [])

  // ✅ Sync user's cart after authentication
  useEffect(() => {
    if (!hasInitialized.current) return

    if (authStatus === 'loggedIn') {
      dispatchCart({
        type: 'MERGE_CART',
        payload: user?.cart,
      })
    }

    if (authStatus === 'loggedOut') {
      dispatchCart({
        type: 'CLEAR_CART',
      })
    }
  }, [user, authStatus])

  // ✅ Debounced function to sync cart with MongoDB
  const syncCartToPayload = useDebouncedCallback(async (user, cart) => {
    if (!user) {
      localStorage.setItem('cart', JSON.stringify(cart))
      return
    }

    try {
      const req = await fetch(`${process.env.NEXT_PUBLIC_SERVER_URL}/api/users/${user.id}`, {
        credentials: 'include',
        method: 'PATCH',
        body: JSON.stringify({ cart }),
        headers: { 'Content-Type': 'application/json' },
      })

      if (req.ok) {
        localStorage.setItem('cart', '[]')
      }
    } catch (e) {
      console.error('Error while syncing cart to Payload.')
    }
  }, 1000) // ✅ Debounce of 1 second

  // ✅ Sync cart to database or localStorage
  useEffect(() => {
    if (!hasInitialized.current || user === undefined) return

    const flattenedCart = {
      ...cart,
      items: cart?.items
        ?.map(item =>
          item?.product && typeof item?.product === 'object'
            ? {
          ...item,
          product: item?.product?.id,
                quantity: typeof item?.quantity === 'number' ? item?.quantity : 0,
        } : null)
        .filter(Boolean) as CartItem[],
    }

    syncCartToPayload(user, flattenedCart)
    setHasInitialized(true)
  }, [user, cart])

  // ✅ Check if a product is in the cart
  const isProductInCart = useCallback(
    (incomingProduct: Product): boolean => {
      const { items: itemsInCart } = cart || {}
      return Array.isArray(itemsInCart) && itemsInCart.some(({ product }) =>
        typeof product === 'string'
          ? product === incomingProduct.id
          : product?.id === incomingProduct.id
      )
    },
    [cart]
  )

  // ✅ Add item to cart
  const addItemToCart = useCallback((incomingItem) => {
    dispatchCart({
      type: 'ADD_ITEM',
      payload: incomingItem,
    })
  }, [])

  // ✅ Remove item from cart
  const deleteItemFromCart = useCallback((incomingProduct: Product) => {
    dispatchCart({
      type: 'DELETE_ITEM',
      payload: incomingProduct,
    })
  }, [])

  // ✅ Clear cart
  const clearCart = useCallback(() => {
    dispatchCart({
      type: 'CLEAR_CART',
    })
  }, [])

  // ✅ Calculate cart total whenever the cart changes
  useEffect(() => {
    if (!hasInitialized) return

    const newTotal =
      cart?.items?.reduce((acc, item) => {
        return (
          acc +
          (typeof item.product === 'object'
            ? JSON.parse(item?.product?.priceJSON || '{}')?.data?.[0]?.unit_amount *
              (typeof item?.quantity === 'number' ? item?.quantity : 0)
            : 0)
        )
      }, 0) || 0

    setTotal({
      formatted: (newTotal / 100).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
      }),
      raw: newTotal,
    })
  }, [cart, hasInitialized])

  return (
    <Context.Provider
      value={{
        cart,
        addItemToCart,
        deleteItemFromCart,
        cartIsEmpty: hasInitializedCart && !arrayHasItems(cart?.items),
        clearCart,
        isProductInCart,
        cartTotal: total,
        hasInitializedCart,
      }}
    >
      {children}
    </Context.Provider>
  )
}
