import { z } from 'zod'

export const env = z
  .object({
    VITE_APP_NAME: z.string(),
  })
  .parse(import.meta.env)
