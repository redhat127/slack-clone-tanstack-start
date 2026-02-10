import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .email('valid email is required.')
    .max(50, 'email is too long.'),
  password: z
    .string()
    .min(1, 'password is required.')
    .max(50, 'password is too long.'),
  rememberMe: z.boolean('invalid input.'),
})
