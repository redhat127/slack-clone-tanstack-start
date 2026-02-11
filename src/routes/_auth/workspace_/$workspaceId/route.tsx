import { ChannelList } from '@/components/channel/channel-list'
import { WorkspaceLayout } from '@/components/layout/workspace-layout'
import { Tooltip } from '@/components/tooltip'
import { Button } from '@/components/ui/button'
import { WorkspaceBtnDropdown } from '@/components/workspace/workspace-btn-dropdown'
import { capitalizeWords, pageTitle } from '@/lib/utils'
import { getUserWorkspace } from '@/serverFn/workspace'
import { createFileRoute, Link, notFound, Outlet } from '@tanstack/react-router'
import { ChevronLeftIcon } from 'lucide-react'

export const Route = createFileRoute('/_auth/workspace_/$workspaceId')({
  component: RouteComponent,
  async loader({ params: { workspaceId } }) {
    const { workspace } = await getUserWorkspace({ data: { workspaceId } })
    if (!workspace) throw notFound()
    return { workspace }
  },
  head({ loaderData }) {
    if (!loaderData) return {}
    return {
      meta: [
        {
          title: pageTitle(
            `Workspace - ${capitalizeWords(loaderData.workspace.name)}`,
          ),
        },
      ],
    }
  },
})

function RouteComponent() {
  const { workspace } = Route.useLoaderData()
  return (
    <WorkspaceLayout
      asideChildren={
        <>
          <Tooltip
            trigger={
              <Button asChild variant="outline" size="icon-sm">
                <Link to="/workspace">
                  <ChevronLeftIcon />
                </Link>
              </Button>
            }
            content="Back to Your Workspaces"
            side="right"
          />
          <div className="mt-4">
            <WorkspaceBtnDropdown />
          </div>
        </>
      }
    >
      <div className="bg-white w-64 h-screen p-4 fixed border-r">
        <ChannelList workspaceId={workspace.id} />
      </div>

      <Outlet />
    </WorkspaceLayout>
  )
}
