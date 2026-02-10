import { z } from 'zod'

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'minimum for name is 3 characters.')
    .max(50, 'name is too long.')
    .regex(
      /^[\p{L}]+(?:[ '-][\p{L}]+)*$/u,
      'name can only contain letters, spaces, hyphens and apostrophes.',
    ),
  email: z
    .string()
    .email('valid email is required.')
    .max(50, 'email is too long.'),
  password: z
    .string()
    .min(10, 'minimum for password is 10 characters.')
    .max(50, 'password is too long.'),
})
