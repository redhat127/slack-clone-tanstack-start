import { Button } from '@/components/ui/button'
import { DialogTrigger } from '@/components/ui/dialog'
import { CreateWorkspaceDialog } from '@/components/workspace/create-workspace-dialog'
import { WorkspaceList } from '@/components/workspace/workspace-list'
import { pageTitle } from '@/lib/utils'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/workspace')({
  component: RouteComponent,
  head() {
    return { meta: [{ title: pageTitle('Your Workspaces') }] }
  },
})

function RouteComponent() {
  return (
    <div className="flex items-center justify-center p-8 h-full">
      <div className="max-w-2xl mx-auto space-y-6 w-full">
        <h1 className="font-bold text-2xl">Your Workspaces</h1>
        <WorkspaceList />
        <CreateWorkspaceDialog
          trigger={
            <DialogTrigger asChild>
              <Button type="button" className="w-full">
                Create Workspace
              </Button>
            </DialogTrigger>
          }
        />
      </div>
    </div>
  )
}
