import { Button } from '@/components/ui/button'
import { pageTitle } from '@/lib/utils'
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_guest/')({
  component: RouteComponent,
  head() {
    return { meta: [{ title: pageTitle('A Tanstack Start Project') }] }
  },
})

function RouteComponent() {
  return (
    <div className="flex items-center justify-center p-8 min-h-screen">
      <Button asChild>
        <Link to="/login">Getting started</Link>
      </Button>
    </div>
  )
}
