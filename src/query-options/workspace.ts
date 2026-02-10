import type { getUserWorkspaces } from '@/serverFn/workspace'
import { queryOptions } from '@tanstack/react-query'

export const workspacesQueryKey = ['workspaces']

export const workspacesQueryOptions = () =>
  queryOptions<Awaited<ReturnType<typeof getUserWorkspaces>>>({
    queryKey: workspacesQueryKey,
    staleTime: 60 * 60 * 1000, // 60 minutes
  })
