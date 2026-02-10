import { LoginForm } from '@/components/form/login-form'
import { AuthLayout } from '@/components/layout/auth-layout'
import { Button } from '@/components/ui/button'
import { pageTitle } from '@/lib/utils'
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_guest/login')({
  component: RouteComponent,
  head() {
    return { meta: [{ title: pageTitle('Login') }] }
  },
})

function RouteComponent() {
  return (
    <AuthLayout
      title="Login"
      description="Use your email and password to login"
    >
      <LoginForm />
      <Button asChild className="mt-4 w-full" variant="outline">
        <Link to="/register">Create an account</Link>
      </Button>
    </AuthLayout>
  )
}
