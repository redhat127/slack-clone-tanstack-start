import { UserDropdown } from '@/components/user-dropdown'
import { CreateWorkspaceDialog } from '@/components/workspace/create-workspace-dialog'
import {
  createFileRoute,
  Outlet,
  redirect,
  useMatchRoute,
} from '@tanstack/react-router'

export const Route = createFileRoute('/_auth')({
  beforeLoad({ context: { user } }) {
    if (!user) {
      throw redirect({ to: '/login', replace: true })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const matchRoute = useMatchRoute()
  const isWorkspaceRoute = matchRoute({ to: '/workspace', fuzzy: false })
  return (
    <div className="flex min-h-screen">
      <aside className="bg-white border-r p-4 w-16 flex flex-col items-center justify-between fixed top-0 left-0 h-full">
        {isWorkspaceRoute && <CreateWorkspaceDialog />}
        <UserDropdown />
      </aside>
      <div className="flex-1 left-16 relative">
        <Outlet />
      </div>
    </div>
  )
}
