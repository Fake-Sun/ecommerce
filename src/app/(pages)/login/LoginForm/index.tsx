'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { Button } from '../../../_components/Button'
import { Input } from '../../../_components/Input'
import { Message } from '../../../_components/Message'
import { useAuth } from '../../../_providers/Auth'

import classes from './index.module.scss'

type FormData = {
  email: string
  password: string
}

const LoginForm: React.FC = () => {
  const router = useRouter()
  const { login, setUser } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const searchParams = useSearchParams()
  const redirectRef = useRef<string | null>(null)

  useEffect(() => {
    redirectRef.current = searchParams.get('redirect')
    console.log('[LoginForm] redirect param:', redirectRef.current)
  }, [searchParams])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>()

  const onSubmit = useCallback(
    async (data: FormData) => {
      try {
        const user = await login(data)
        setUser(user)

        if (redirectRef.current) {
          router.push(redirectRef.current)
        } else {
          router.push('/')
        }
      } catch (_) {
        setError('There was an error with the credentials provided. Please try again.')
      }
    },
    [login, setUser, router],
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={classes.form}>
      <Message error={error} className={classes.message} />
      <Input
        name="email"
        label="Email Address"
        required
        register={register}
        error={errors.email}
        type="email"
      />
      <Input
        name="password"
        type="password"
        label="Password"
        required
        register={register}
        error={errors.password}
      />
      <Button
        type="submit"
        appearance="primary"
        label={isSubmitting ? 'Processing' : 'Login'}
        disabled={isSubmitting}
        className={classes.submit}
      />
      <div className={classes.links}>
        <button type="button" onClick={() => (window.location.href = '/create-account')}>
          Create an account
        </button>
        <br />
        <button type="button" onClick={() => (window.location.href = '/recover-password')}>
          Recover your password
        </button>
      </div>
    </form>
  )
}

export default LoginForm
