import type { getMessages } from '@/serverFn/message'
import { queryOptions } from '@tanstack/react-query'
import { workspacePrefixQueryKeyString } from './channel'

export const messagesQueryKey = (workspaceId: string, channelId: string) => [
  workspacePrefixQueryKeyString,
  { workspaceId },
  'channels',
  { channelId },
  'messages',
]

export type Messages = Awaited<ReturnType<typeof getMessages>>['messages']

export const messagesQueryOptions = (
  workspaceId: string,
  channelId: string,
) => {
  const queryKey = messagesQueryKey(workspaceId, channelId)
  return queryOptions<Messages>({
    queryKey,
    staleTime: 60 * 60 * 1000, // 60 minutes
  })
}
