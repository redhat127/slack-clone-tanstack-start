import { pageTitle } from '@/lib/utils'
import { workspacesQueryOptions } from '@/query-options/workspace'
import { getUserWorkspaces } from '@/serverFn/workspace'
import { useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { Suspense } from 'react'

export const Route = createFileRoute('/_auth/workspace')({
  component: RouteComponent,
  head() {
    return { meta: [{ title: pageTitle('Your Workspaces') }] }
  },
})

function RouteComponent() {
  return <WorkspaceList />
}

const WorkspaceList = () => {
  return (
    <Suspense fallback={<div>LOADING...</div>}>
      <WorkspaceListSuspense />
    </Suspense>
  )
}

const WorkspaceListSuspense = () => {
  const getUserWorkspacesFn = useServerFn(getUserWorkspaces)
  useSuspenseQuery({
    ...workspacesQueryOptions(),
    queryFn({ signal }) {
      return getUserWorkspacesFn({ signal })
    },
  })
  return null
}
