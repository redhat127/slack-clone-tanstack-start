import { Button } from '@/components/ui/button'
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_guest/')({
  component: RouteComponent,
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
