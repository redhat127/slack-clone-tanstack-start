import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_guest')({
  beforeLoad({ context: { user } }) {
    if (user) {
      throw redirect({ to: '/workspace', replace: true })
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  return <Outlet />
}
