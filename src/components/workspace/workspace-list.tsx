import { useDeleteWorkspace } from '@/hooks/workspace/use-delete-workspace'
import { workspacesQueryOptions } from '@/query-options/workspace'
import { getUserWorkspaces } from '@/serverFn/workspace'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { DoorOpen, TrashIcon } from 'lucide-react'
import { Suspense } from 'react'
import { Tooltip } from '../tooltip'
import { Button } from '../ui/button'
import { Card, CardHeader, CardTitle } from '../ui/card'
import { Skeleton } from '../ui/skeleton'

const WorkspaceListSkeleton = () => {
  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <Card key={index}>
          <CardHeader className="gap-0 flex items-center justify-between gap-x-4">
            <CardTitle className="w-full">
              <Skeleton className="h-7" />
            </CardTitle>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-md" />
            </div>
          </CardHeader>
        </Card>
      ))}
    </>
  )
}

const DeleteWorkspace = ({ workspaceId }: { workspaceId: string }) => {
  const { isPending, deleteFn } = useDeleteWorkspace({ workspaceId })
  return (
    <Tooltip
      content="Delete"
      trigger={
        <Button
          type="button"
          disabled={isPending}
          variant="outline"
          size="icon-sm"
          className="text-destructive hover:text-destructive"
          onClick={deleteFn}
        >
          <TrashIcon />
        </Button>
      }
    />
  )
}

const WorkspaceListSuspense = () => {
  const getUserWorkspacesFn = useServerFn(getUserWorkspaces)
  const queryOptions = workspacesQueryOptions()
  const { data: workspaces } = useSuspenseQuery({
    ...queryOptions,
    async queryFn({ signal }) {
      return getUserWorkspacesFn({ signal })
    },
  })
  return workspaces.length ? (
    <div className="space-y-4">
      {workspaces.map((workspace) => (
        <Card key={workspace.id}>
          <CardHeader className="gap-0 flex items-center justify-between gap-x-4">
            <CardTitle className="flex items-center gap-2">
              <h2 className="font-bold capitalize">{workspace.name}</h2>
              {workspace.isCreator && (
                <span className="text-xs font-semibold bg-primary text-primary-foreground px-2 py-0.5 rounded">
                  Creator
                </span>
              )}
              {workspace.isAdmin && !workspace.isCreator && (
                <span className="text-xs font-semibold bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
                  Admin
                </span>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Tooltip
                content="Enter"
                trigger={
                  <Button asChild size="icon-sm" variant="outline">
                    <Link
                      to="/workspace/$workspaceId"
                      params={{ workspaceId: workspace.id }}
                    >
                      <DoorOpen />
                    </Link>
                  </Button>
                }
              />
              {workspace.isCreator && (
                <DeleteWorkspace workspaceId={workspace.id} />
              )}
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  ) : (
    <p className="text-sm italic text-muted-foreground">No workspace found.</p>
  )
}

export const WorkspaceList = () => {
  return (
    <Suspense fallback={<WorkspaceListSkeleton />}>
      <WorkspaceListSuspense />
    </Suspense>
  )
}
