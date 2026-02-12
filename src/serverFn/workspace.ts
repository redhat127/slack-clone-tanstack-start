import { db } from '@/db'
import { member, workspace as workspaceTable } from '@/db/schema'
import { isAuthenticated } from '@/middleware'
import {
  createWorkspaceSchema,
  workspaceNameZodSchema,
} from '@/zod-schema/workspace/create-workspace-schema'
import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import z from 'zod'

export const getUserWorkspaces = createServerFn({ method: 'GET' })
  .middleware([isAuthenticated])
  .handler(async ({ context: { userId } }) => {
    const members = await db.query.member.findMany({
      where(fields, operators) {
        return operators.eq(fields.userId, userId)
      },
      columns: { workspaceId: true, role: true, createdAt: true },
      orderBy(fields, operators) {
        return operators.desc(fields.createdAt)
      },
    })

    if (!members.length) return []

    const workspaceIds = members.map((m) => m.workspaceId)

    const workspaces = await db.query.workspace.findMany({
      where(fields, operators) {
        return operators.inArray(fields.id, workspaceIds)
      },
    })

    // Create workspace map for quick lookup
    const workspaceMap = new Map(workspaces.map((w) => [w.id, w]))

    // Return in the order of members.createdAt (already sorted)
    return members
      .map((m) => {
        const workspace = workspaceMap.get(m.workspaceId)
        if (!workspace) return null
        return {
          ...workspace,
          isAdmin: m.role === 'admin',
          isCreator: workspace.userId === userId,
        }
      })
      .filter((w) => w !== null)
  })

export const getUserWorkspace = createServerFn({ method: 'GET' })
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
    if (!isMember) return { workspace: null }
    const workspace = await db.query.workspace.findFirst({
      where(fields, operators) {
        return operators.eq(fields.id, workspaceId)
      },
    })
    if (!workspace) return { workspace: null }
    return {
      workspace: {
        ...workspace,
        isAdmin: isMember.role === 'admin',
        isCreator: workspace.userId === userId,
      },
    }
  })

export const createWorkspace = createServerFn({ method: 'POST' })
  .middleware([isAuthenticated])
  .inputValidator(createWorkspaceSchema)
  .handler(async ({ context: { userId }, data: { name } }) => {
    const [newWorkspace] = await db
      .insert(workspaceTable)
      .values({
        name,
        userId,
      })
      .returning({ id: workspaceTable.id })
    await db.insert(member).values({
      userId,
      workspaceId: newWorkspace.id,
      role: 'admin',
    })
    return { newWorkspaceId: newWorkspace.id }
  })

export const deleteWorkspace = createServerFn({ method: 'POST' })
  .middleware([isAuthenticated])
  .inputValidator(
    z.object({
      workspaceId: z.string(),
    }),
  )
  .handler(async ({ context: { userId }, data: { workspaceId } }) => {
    const { rowCount } = await db
      .delete(workspaceTable)
      .where(
        and(
          eq(workspaceTable.id, workspaceId),
          eq(workspaceTable.userId, userId),
        ),
      )
    if (rowCount === 1) {
      return { failed: false }
    }
    return { failed: true }
  })

export const updateWorkspace = createServerFn({ method: 'POST' })
  .middleware([isAuthenticated])
  .inputValidator(
    z.object({
      workspaceId: z.string(),
      name: workspaceNameZodSchema,
    }),
  )
  .handler(async ({ context: { userId }, data: { workspaceId, name } }) => {
    const { rowCount } = await db
      .update(workspaceTable)
      .set({
        name,
      })
      .where(
        and(
          eq(workspaceTable.id, workspaceId),
          eq(workspaceTable.userId, userId),
        ),
      )
    if (rowCount === 1) {
      return { failed: false }
    }
    return { failed: true }
  })
