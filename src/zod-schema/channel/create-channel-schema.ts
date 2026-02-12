import z from 'zod'

export const channelNameZodSchema = z
  .string()
  .trim()
  .min(3, 'minimum for name is 3 characters.')
  .max(50, 'name is too long.')
  .regex(
    /^[a-z0-9-_]+$/,
    'channel name can only contain lowercase letters, numbers, hyphens and underscores.',
  )

export const createChannelSchema = z.object({
  name: channelNameZodSchema,
})
