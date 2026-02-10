import { authClient } from '@/lib/auth-client'
import { registerSchema } from '@/zod-schema/register-schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { SubmitBtn } from '../submit-btn'
import { TextInput } from '../text-input'
import { FieldGroup } from '../ui/field'

export const RegisterForm = () => {
  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  })
  const [isPending, setIsPending] = useState(false)
  const isFormDisabled = form.formState.isSubmitting || isPending
  const navigate = useNavigate()
  return (
    <form
      onSubmit={form.handleSubmit(async (data) => {
        setIsPending(true)
        try {
          const { error } = await authClient.signUp.email(data)
          if (error) {
            toast.error(error.message ?? 'Failed to register. try again.')
            return
          }
          toast.success('You are registered.')
          navigate({ to: '/login' })
        } catch {
          toast.error('Failed to register. try again.')
        } finally {
          setIsPending(false)
        }
      })}
    >
      <FieldGroup className="gap-4">
        <TextInput control={form.control} name="name" label="Name" />
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
        <SubmitBtn disabled={isFormDisabled}>Register</SubmitBtn>
      </FieldGroup>
    </form>
  )
}
