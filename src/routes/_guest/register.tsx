import { RegisterForm } from '@/components/form/register-form'
import { AuthLayout } from '@/components/layout/auth-layout'
import { Button } from '@/components/ui/button'
import { pageTitle } from '@/lib/utils'
import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/_guest/register')({
  component: RouteComponent,
  head() {
    return { meta: [{ title: pageTitle('Register') }] }
  },
})

function RouteComponent() {
  return (
    <AuthLayout title="Register" description="Fill inputs below to register">
      <RegisterForm />
      <Button asChild className="mt-4 w-full" variant="outline">
        <Link to="/login">Back to login</Link>
      </Button>
    </AuthLayout>
  )
}
