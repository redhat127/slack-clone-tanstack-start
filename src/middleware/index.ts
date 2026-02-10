import { getUser } from '@/serverFn'
import { redirect } from '@tanstack/react-router'
import { createMiddleware } from '@tanstack/react-start'

export const isAuthenticated = createMiddleware().server(async ({ next }) => {
  const user = await getUser()
  if (!user) throw redirect({ to: '/login', replace: true })
  return next({ context: { userId: user.id } })
})
