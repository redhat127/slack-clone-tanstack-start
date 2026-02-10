import { db } from '@/db'
import { workspace as workspaceTable } from '@/db/schema'
import { isAuthenticated } from '@/middleware'
import { createWorkspaceSchema } from '@/zod-schema/workspace/create-workspace'
import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import z from 'zod'

export const getUserWorkspaces = createServerFn({ method: 'GET' })
  .middleware([isAuthenticated])
  .handler(async ({ context: { userId } }) => {
    return db.query.workspace.findMany({
      where(fields, operators) {
        return operators.eq(fields.userId, userId)
      },
      orderBy(fields, operators) {
        return operators.desc(fields.createdAt)
      },
    })
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
