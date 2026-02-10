import { UserDropdown } from '@/components/user-dropdown'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth')({
  beforeLoad({ context: { user } }) {
    if (!user) {
      throw redirect({ to: '/login', replace: true })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <div className="flex min-h-screen">
      <aside className="bg-white border-r p-4 flex flex-col items-center justify-between fixed top-0 left-0 h-full">
        <UserDropdown />
      </aside>
      <div className="flex-1">
        <Outlet />
      </div>
    </div>
  )
}
