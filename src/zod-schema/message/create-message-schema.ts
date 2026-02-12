// zod-schema/message/create-message.ts
import { z } from 'zod'

export const createMessageSchema = z.object({
  body: z.string(),
  channelId: z.string(),
  workspaceId: z.string(),
  parentMessageId: z.string().optional(),
})
