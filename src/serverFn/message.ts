// serverFn/message.ts
import { db } from '@/db'
import {
  channel,
  member,
  message,
  workspace as workspaceDbSchema,
} from '@/db/schema'
import { emitToChannel } from '@/lib/emit'
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

      await emitToChannel(channelId, 'channel:newMessage', newMessage, userId)

      return {
        failed: false,
        newMessage: newMessage
          ? {
              ...newMessage,
              member: {
                ...newMessage.member,
                isCurrentMember: true,
                canDelete: true, // sender can always delete their own message
              },
            }
          : null,
      }
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
                columns: { id: true, name: true, image: true },
              },
            },
          },
        },
        orderBy: (m, { asc }) => asc(m.createdAt),
      })

      const targetWorkspace = await db.query.workspace.findFirst({
        where: eq(workspaceDbSchema.id, workspaceId),
      })

      const targetChannel = await db.query.channel.findFirst({
        where: and(
          eq(channel.id, channelId),
          eq(channel.workspaceId, workspaceId),
        ),
      })

      const isWorkspaceCreator = targetWorkspace?.userId === userId
      const isChannelCreator = targetChannel?.createdBy === userId

      const enriched = messages.map((m) => {
        const isOwnMessage = m.memberId === currentMember.id
        const messageAuthorIsAdmin = m.member.role === 'admin'
        const messageAuthorIsWorkspaceCreator =
          targetWorkspace?.userId === m.member.userId

        let canDelete = false
        if (isOwnMessage) {
          canDelete = true
        } else if (isWorkspaceCreator) {
          canDelete = true
        } else if (isChannelCreator) {
          canDelete = !messageAuthorIsWorkspaceCreator
        } else if (currentMember.role === 'admin') {
          canDelete = !messageAuthorIsAdmin && !messageAuthorIsWorkspaceCreator
        }

        return {
          ...m,
          member: {
            ...m.member,
            isCurrentMember: m.memberId === currentMember.id,
            canDelete,
          },
        }
      })

      return { messages: enriched }
    },
  )

export const deleteMessage = createServerFn({ method: 'POST' })
  .middleware([isAuthenticated])
  .inputValidator(
    z.object({
      messageId: z.string(),
      workspaceId: z.string(),
      channelId: z.string(),
    }),
  )
  .handler(
    async ({
      context: { userId },
      data: { messageId, workspaceId, channelId },
    }) => {
      // 1. Fetch current user's member record
      const currentMember = await db.query.member.findFirst({
        where: and(
          eq(member.userId, userId),
          eq(member.workspaceId, workspaceId),
        ),
      })
      if (!currentMember) return { failed: true }

      // 2. Fetch the target message with its author's member record
      const targetMessage = await db.query.message.findFirst({
        where: and(
          eq(message.id, messageId),
          eq(message.channelId, channelId),
          eq(message.deleted, false),
        ),
        with: {
          member: true, // the message author's member record
        },
      })
      if (!targetMessage) return { failed: true }

      // 3. Fetch the workspace to identify the workspace creator
      const targetWorkspace = await db.query.workspace.findFirst({
        where: eq(workspaceDbSchema.id, workspaceId),
      })
      if (!targetWorkspace) return { failed: true }

      // 4. Fetch the channel to identify the channel creator
      const targetChannel = await db.query.channel.findFirst({
        where: and(
          eq(channel.id, channelId),
          eq(channel.workspaceId, workspaceId),
        ),
      })
      if (!targetChannel) return { failed: true }

      const isOwnMessage = targetMessage.memberId === currentMember.id
      const isAdmin = currentMember.role === 'admin'
      const isChannelCreator = targetChannel.createdBy === userId // see note below
      const isWorkspaceCreator = targetWorkspace.userId === userId
      const messageAuthorIsAdmin = targetMessage.member.role === 'admin'
      const messageAuthorIsWorkspaceCreator =
        targetWorkspace.userId === targetMessage.member.userId

      let canDelete = false

      if (isOwnMessage) {
        // Rule 1: authors can always delete their own messages
        canDelete = true
      } else if (isWorkspaceCreator) {
        // Rule 4 (highest privilege): workspace creator can delete anyone's message
        // Exception: cannot delete another workspace creator's message (i.e. themselves — already covered by isOwnMessage)
        canDelete = true
      } else if (isChannelCreator) {
        // Rule 3: channel creator can delete everyone's messages…
        // …except messages belonging to the workspace creator
        canDelete = !messageAuthorIsWorkspaceCreator
      } else if (isAdmin) {
        // Rule 2: admins can delete member messages, but not other admins' or workspace creator's messages
        canDelete = !messageAuthorIsAdmin && !messageAuthorIsWorkspaceCreator
      }

      if (!canDelete) return { failed: true }

      await db
        .update(message)
        .set({ deleted: true })
        .where(eq(message.id, messageId))

      await emitToChannel(channelId, 'channel:deleteMessage', messageId, userId)

      return { failed: false }
    },
  )
