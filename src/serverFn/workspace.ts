import { db } from '@/db'
import { workspace as workspaceTable } from '@/db/schema'
import { isAuthenticated } from '@/middleware'
import { createWorkspaceSchema } from '@/zod-schema/workspace/create-workspace'
import { createServerFn } from '@tanstack/react-start'

export const getUserWorkspaces = createServerFn({ method: 'GET' })
  .middleware([isAuthenticated])
  .handler(async ({ context: { userId } }) => {
    return db.query.workspace.findMany({
      where(fields, operators) {
        return operators.eq(fields.userId, userId)
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
