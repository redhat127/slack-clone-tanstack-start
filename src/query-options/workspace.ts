import { queryOptions } from '@tanstack/react-query'

export const workspacesQueryKey = ['workspaces']

export const workspacesQueryOptions = () =>
  queryOptions({
    queryKey: workspacesQueryKey,
    staleTime: 60 * 60 * 1000, // 60 minutes
  })
