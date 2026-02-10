import { authClient } from '@/lib/auth-client'
import { workspacesQueryKey } from '@/query-options/workspace'
import { useNavigate, useRouteContext } from '@tanstack/react-router'
import { LogOutIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export const LogoutForm = () => {
  const [isPending, setIsPending] = useState(false)
  const navigate = useNavigate()
  const { queryClient } = useRouteContext({ from: '__root__' })
  return (
    <form
      className="w-full"
      onSubmit={async (e) => {
        e.preventDefault()
        setIsPending(true)
        try {
          const { data: result, error } = await authClient.signOut()
          if (error) {
            toast.error(error.message ?? 'Failed to logout. try again.')
            return
          }
          if (result.success) {
            toast.success('You are logged out.')
            navigate({ to: '/', replace: true })
            queryClient.removeQueries({
              queryKey: workspacesQueryKey,
            })
          }
        } catch {
          toast.error('Failed to logout. try again.')
        } finally {
          setIsPending(false)
        }
      }}
    >
      <button
        type="submit"
        disabled={isPending}
        className="w-full flex items-center gap-1.5 text-red-600 py-1.5 px-2"
      >
        <LogOutIcon className="text-inherit" />
        Logout
      </button>
    </form>
  )
}
