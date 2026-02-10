import { pageTitle } from '@/lib/utils'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/workspace')({
  component: RouteComponent,
  head() {
    return { meta: [{ title: pageTitle('Your Workspaces') }] }
  },
})

function RouteComponent() {
  return null
}
