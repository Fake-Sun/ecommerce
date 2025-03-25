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

  // ✅ Wrap searchParams to avoid hydration issues
  const searchParamsHook = useSearchParams()
  const [searchParams, setSearchParams] = useState<URLSearchParams>()
  const redirect = useRef<string | null>(null)

  useEffect(() => {
    setSearchParams(searchParamsHook)
    redirect.current = searchParamsHook.get('redirect')
  }, [searchParamsHook])

  const allParams = searchParams?.toString() ? `?${searchParams.toString()}` : ''

  const {
    register,
    handleSubmit,
    formState: { errors, isLoading },
  } = useForm<FormData>()

  const onSubmit = useCallback(
    async (data: FormData) => {
      try {
        const user = await login(data)
        setUser(user)
        if (redirect?.current) router.push(redirect.current)
        else router.push('/')
        window.location.href = '/'
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
        label={isLoading ? 'Processing' : 'Login'}
        disabled={isLoading}
        className={classes.submit}
      />
      <div className={classes.links}>
        <Link href={`/create-account${allParams}`}>Create an account</Link>
        <br />
        <Link href={`/recover-password${allParams}`}>Recover your password</Link>
      </div>
    </form>
  )
}

export default LoginForm
