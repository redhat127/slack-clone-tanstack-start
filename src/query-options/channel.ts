import type { getWorkspaceChannels } from '@/serverFn/channel'
import { queryOptions } from '@tanstack/react-query'

export const workspacePrefixQueryKeyString = 'workspace'

export const channelsQueryKey = (workspaceId: string) => [
  workspacePrefixQueryKeyString,
  { workspaceId },
  'channels',
]

export const channelsQueryOptions = (workspaceId: string) => {
  const queryKey = channelsQueryKey(workspaceId)
  return queryOptions<
    Awaited<ReturnType<typeof getWorkspaceChannels>>['channels']
  >({
    queryKey,
    staleTime: 60 * 60 * 1000, // 60 minutes
  })
}
