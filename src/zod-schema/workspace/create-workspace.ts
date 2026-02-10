import z from 'zod'

export const createWorkspaceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, 'minimum for name is 3 characters.')
    .max(50, 'name is too long.')
    .regex(
      /^[\p{L}\p{N}]+(?:[ '-][\p{L}\p{N}]+)*$/u,
      'workspace name can only contain letters, numbers, spaces, hyphens and apostrophes.',
    ),
})
