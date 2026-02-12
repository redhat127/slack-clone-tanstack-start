import z from 'zod'

export const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/avif',
] as const

export const imageFileSchema = z
  .instanceof(File)
  .refine((f) => f.size > 0, { message: 'File is empty.' })
  .refine((f) => f.size <= 2 * 1024 * 1024, { message: 'File is too large.' })
  .refine((f) => ALLOWED_IMAGE_MIMES.includes(f.type as any), {
    message: 'Invalid file type.',
  })
