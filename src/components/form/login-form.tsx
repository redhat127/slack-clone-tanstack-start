import { authClient } from '@/lib/auth-client'
import { loginSchema } from '@/zod-schema/login-schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { CheckboxInput } from '../checkbox-input'
import { SubmitBtn } from '../submit-btn'
import { TextInput } from '../text-input'
import { FieldGroup } from '../ui/field'

export const LoginForm = () => {
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  })
  const [isPending, setIsPending] = useState(false)
  const isFormDisabled = form.formState.isSubmitting || isPending
  const navigate = useNavigate()
  return (
    <form
      onSubmit={form.handleSubmit(async (data) => {
        setIsPending(true)
        try {
          const { error } = await authClient.signIn.email(data)
          if (error) {
            toast.error(error.message ?? 'Failed to login. try again.')
            return
          }
          toast.success('You are logged in.')
          navigate({ to: '/workspace', replace: true })
        } catch {
          toast.error('Failed to login. try again.')
        } finally {
          setIsPending(false)
        }
      })}
    >
      <FieldGroup className="gap-4">
        <TextInput
          control={form.control}
          name="email"
          label="Email"
          inputProps={{ type: 'email' }}
        />
        <TextInput
          control={form.control}
          name="password"
          label="Password"
          inputProps={{ type: 'password' }}
        />
        <CheckboxInput
          control={form.control}
          name="rememberMe"
          label="Remember me?"
        />
        <SubmitBtn disabled={isFormDisabled}>Login</SubmitBtn>
      </FieldGroup>
    </form>
  )
}
