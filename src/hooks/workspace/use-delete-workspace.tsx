import { workspacesQueryKey } from '@/query-options/workspace'
import { deleteWorkspace } from '@/serverFn/workspace'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

export const useDeleteWorkspace = ({
  workspaceId,
  onSuccess,
}: {
  workspaceId: string
  onSuccess?: () => void
}) => {
  const [isPending, setIsPending] = useState(false)
  const queryClient = useQueryClient()
  const deleteFn = async () => {
    if (!confirm('Are you sure you want to delete this workspace?')) return
    setIsPending(true)
    try {
      const response = await deleteWorkspace({
        data: { workspaceId },
      })
      if (response.failed) {
        toast.error('Failed to delete workspace. try again.')
        return
      }
      toast.success('Workspace deleted.')
      queryClient.invalidateQueries({
        queryKey: workspacesQueryKey,
        exact: true,
      })
      onSuccess?.()
    } catch {
      toast.error('Failed to delete workspace. try again.')
    } finally {
      setIsPending(false)
    }
  }
  return {
    isPending,
    deleteFn,
  }
}
