import { createFileRoute } from '@tanstack/react-router'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'
import { imageFileSchema } from './-utils'

export const Route = createFileRoute('/api/upload/')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const formData = await request.formData()
        const file = formData.get('image')

        const result = imageFileSchema.safeParse(file)
        if (!result.success) {
          return Response.json(
            { error: result.error.issues[0].message },
            { status: 400 },
          )
        }

        const uploadDir = join(process.cwd(), 'public', 'uploads', 'messages')

        try {
          await mkdir(uploadDir, { recursive: true })
          const buffer = Buffer.from(await result.data.arrayBuffer())
          const [webpBuffer, previewBuffer] = await Promise.all([
            sharp(buffer)
              .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
              .webp({ quality: 75 })
              .toBuffer(),
            sharp(buffer)
              .resize(100, 100, { fit: 'inside', withoutEnlargement: true })
              .webp({ quality: 60 })
              .toBuffer(),
          ])

          const filename = crypto.randomUUID()
          await writeFile(join(uploadDir, `${filename}.webp`), webpBuffer)
          await writeFile(
            join(uploadDir, `${filename}_preview.webp`),
            previewBuffer,
          )

          return Response.json({
            path: `/uploads/messages/${filename}.webp`,
            previewPath: `/uploads/messages/${filename}_preview.webp`,
          })
        } catch (err) {
          console.error('Failed to write file:', err)
          return Response.json(
            { error: 'Failed to save file.' },
            { status: 500 },
          )
        }
      },
    },
  },
})
