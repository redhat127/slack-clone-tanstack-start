// create-workspace-dialog.tsx
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { workspacesQueryKey } from '@/query-options/workspace'
import { createWorkspace } from '@/serverFn/workspace'
import { createWorkspaceSchema } from '@/zod-schema/workspace/create-workspace'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouteContext } from '@tanstack/react-router'
import { ReactNode, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { SubmitBtn } from '../submit-btn'
import { TextInput } from '../text-input'
import { FieldGroup } from '../ui/field'

export const CreateWorkspaceDialog = ({ trigger }: { trigger: ReactNode }) => {
  const { queryClient } = useRouteContext({ from: '/_auth/workspace' })
  const [isOpen, setIsOpen] = useState(false)
  const form = useForm({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: { name: '' },
  })
  const [isPending, setIsPending] = useState(false)
  const isFormDisabled = form.formState.isSubmitting || isPending
  const closeDialog = () => {
    setIsOpen(false)
    form.reset()
  }
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger}
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-base">Create Workspace</DialogTitle>
          <DialogDescription>
            Enter a name for your new workspace
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(async (data) => {
            setIsPending(true)
            try {
              await createWorkspace({ data })
              closeDialog()
              toast.success('Workspace created.')
              queryClient.invalidateQueries({
                queryKey: workspacesQueryKey,
                exact: true,
              })
            } catch {
              toast.error('Failed to create workspace. try again.')
            } finally {
              setIsPending(false)
            }
          })}
        >
          <FieldGroup className="gap-4">
            <TextInput control={form.control} name="name" label="Name" />
            <DialogFooter>
              <Button
                type="button"
                onClick={closeDialog}
                variant="outline"
                disabled={isFormDisabled}
              >
                Cancel
              </Button>
              <SubmitBtn disabled={isFormDisabled}>Create</SubmitBtn>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )
}
