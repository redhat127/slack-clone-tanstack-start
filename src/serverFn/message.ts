// serverFn/message.ts
import { db } from '@/db'
import { channel, member, message } from '@/db/schema'
import { isAuthenticated } from '@/middleware'
import { createMessageSchema } from '@/zod-schema/message/create-message-schema'
import { createServerFn } from '@tanstack/react-start'
import { and, eq, isNull } from 'drizzle-orm'
import z from 'zod'
export const createMessage = createServerFn({ method: 'POST' })
  .middleware([isAuthenticated])
  .inputValidator(createMessageSchema)
  .handler(
    async ({
      context: { userId },
      data: { body, channelId, workspaceId, parentMessageId },
    }) => {
      const existingChannel = await db.query.channel.findFirst({
        where: and(
          eq(channel.id, channelId),
          eq(channel.workspaceId, workspaceId),
        ),
      })
      if (!existingChannel) return { failed: true, newMessage: null }

      const currentMember = await db.query.member.findFirst({
        where: and(
          eq(member.userId, userId),
          eq(member.workspaceId, workspaceId),
        ),
      })
      if (!currentMember) return { failed: true, newMessage: null }

      const [inserted] = await db
        .insert(message)
        .values({
          body,
          channelId,
          memberId: currentMember.id,
          ...(parentMessageId && { parentMessageId }),
        })
        .returning()

      const newMessage = await db.query.message.findFirst({
        where: eq(message.id, inserted.id),
        with: {
          member: {
            with: {
              user: {
                columns: { id: true, name: true, image: true },
              },
            },
          },
        },
      })

      return { failed: false, newMessage }
    },
  )

export const getMessages = createServerFn({ method: 'GET' })
  .middleware([isAuthenticated])
  .inputValidator(z.object({ channelId: z.string(), workspaceId: z.string() }))
  .handler(
    async ({ context: { userId }, data: { channelId, workspaceId } }) => {
      const currentMember = await db.query.member.findFirst({
        where: and(
          eq(member.userId, userId),
          eq(member.workspaceId, workspaceId),
        ),
      })
      if (!currentMember) return { messages: [] }
      const messages = await db.query.message.findMany({
        where: and(
          eq(message.channelId, channelId),
          eq(message.deleted, false),
          isNull(message.parentMessageId),
        ),
        with: {
          member: {
            with: {
              user: {
                columns: {
                  id: true,
                  name: true,
                  image: true,
                },
              },
            },
          },
        },
        orderBy: (m, { asc }) => asc(m.createdAt),
      })
      return { messages }
    },
  )
