import { db } from '@/db'
import { channel } from '@/db/schema'
import { isAuthenticated } from '@/middleware'
import { channelNameZodSchema } from '@/zod-schema/channel/create-channel'
import { createServerFn } from '@tanstack/react-start'
import { eq } from 'drizzle-orm'
import z from 'zod'

export const getChannel = createServerFn({ method: 'GET' })
  .middleware([isAuthenticated])
  .inputValidator(
    z.object({
      workspaceId: z.string(),
      channelId: z.string(),
    }),
  )
  .handler(
    async ({ data: { workspaceId, channelId }, context: { userId } }) => {
      const isMember = await db.query.member.findFirst({
        where(fields, operators) {
          return operators.and(
            operators.eq(fields.workspaceId, workspaceId),
            operators.eq(fields.userId, userId),
          )
        },
      })
      if (!isMember) return null
      const result = await db.query.channel.findFirst({
        where(fields, operators) {
          return operators.eq(fields.id, channelId)
        },
      })
      if (!result) return null
      return { ...result, isWorkspaceAdmin: isMember.role === 'admin' }
    },
  )

export const getWorkspaceChannels = createServerFn({ method: 'GET' })
  .middleware([isAuthenticated])
  .inputValidator(
    z.object({
      workspaceId: z.string(),
    }),
  )
  .handler(async ({ context: { userId }, data: { workspaceId } }) => {
    const isMember = await db.query.member.findFirst({
      where(fields, operators) {
        return operators.and(
          operators.eq(fields.workspaceId, workspaceId),
          operators.eq(fields.userId, userId),
        )
      },
    })
    if (!isMember) return { channels: [] }
    const channels = await db.query.channel.findMany({
      where(fields, operators) {
        return operators.eq(fields.workspaceId, workspaceId)
      },
      orderBy(fields, operators) {
        return operators.asc(fields.createdAt)
      },
    })
    return { channels }
  })

export const createChannel = createServerFn({ method: 'POST' })
  .middleware([isAuthenticated])
  .inputValidator(
    z.object({
      workspaceId: z.string(),
      name: channelNameZodSchema,
    }),
  )
  .handler(async ({ context: { userId }, data: { name, workspaceId } }) => {
    const isMember = await db.query.member.findFirst({
      where(fields, operators) {
        return operators.and(
          operators.eq(fields.workspaceId, workspaceId),
          operators.eq(fields.userId, userId),
        )
      },
    })
    if (!isMember || isMember.role === 'member') return { failed: true }
    const [newChannelId] = await db
      .insert(channel)
      .values({
        name,
        workspaceId,
      })
      .returning({ id: channel.id })
    return { newChannelId, failed: false }
  })

export const updateChannel = createServerFn({ method: 'POST' })
  .middleware([isAuthenticated])
  .inputValidator(
    z.object({
      workspaceId: z.string(),
      channelId: z.string(),
      name: channelNameZodSchema,
    }),
  )
  .handler(
    async ({ context: { userId }, data: { name, workspaceId, channelId } }) => {
      const isMember = await db.query.member.findFirst({
        where(fields, operators) {
          return operators.and(
            operators.eq(fields.workspaceId, workspaceId),
            operators.eq(fields.userId, userId),
          )
        },
      })
      if (!isMember || isMember.role === 'member') return { failed: true }
      const { rowCount } = await db
        .update(channel)
        .set({
          name,
        })
        .where(eq(channel.id, channelId))
      if (rowCount !== 1) {
        return { failed: true }
      }
      return { failed: false }
    },
  )

export const deleteChannel = createServerFn({ method: 'POST' })
  .middleware([isAuthenticated])
  .inputValidator(
    z.object({
      workspaceId: z.string(),
      channelId: z.string(),
    }),
  )
  .handler(
    async ({ context: { userId }, data: { workspaceId, channelId } }) => {
      const isMember = await db.query.member.findFirst({
        where(fields, operators) {
          return operators.and(
            operators.eq(fields.workspaceId, workspaceId),
            operators.eq(fields.userId, userId),
          )
        },
      })
      if (!isMember || isMember.role === 'member') return { failed: true }
      const { rowCount } = await db
        .delete(channel)
        .where(eq(channel.id, channelId))
      if (rowCount !== 1) {
        return { failed: true }
      }
      return { failed: false }
    },
  )
