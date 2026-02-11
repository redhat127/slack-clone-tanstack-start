import { useDeleteWorkspace } from '@/hooks/workspace/use-delete-workspace'
import { workspacesQueryKey } from '@/query-options/workspace'
import { updateWorkspace } from '@/serverFn/workspace'
import { createWorkspaceSchema } from '@/zod-schema/workspace/create-workspace'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import { getRouteApi, useNavigate, useRouter } from '@tanstack/react-router'
import { SettingsIcon, TrashIcon } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { SubmitBtn } from '../submit-btn'
import { TextInput } from '../text-input'
import { Tooltip } from '../tooltip'
import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { FieldContent } from '../ui/field'

export const WorkspaceBtnDropdown = () => {
  const { workspace } = getRouteApi(
    '/_auth/workspace_/$workspaceId',
  ).useLoaderData()
  const nameFirstLetterCapitalized = workspace.name.slice(0, 1).toUpperCase()
  return (
    <DropdownMenu>
      <Tooltip
        trigger={
          <DropdownMenuTrigger asChild>
            <Button type="button" size="icon-sm">
              {nameFirstLetterCapitalized}
            </Button>
          </DropdownMenuTrigger>
        }
        content="Open Workspace Menu"
        side="right"
      />
      <DropdownMenuContent side="right" align="start">
        <DropdownMenuLabel asChild>
          <div className="flex items-center gap-2">
            <div className="bg-black text-white w-8 h-8 rounded-md flex items-center justify-center">
              {nameFirstLetterCapitalized}
            </div>
            <p className="capitalize max-w-32 truncate">{workspace.name}</p>
          </div>
        </DropdownMenuLabel>
        {workspace.isCreator && (
          <>
            <DropdownMenuSeparator />
            <WorkspacePreferences
              workspaceId={workspace.id}
              workspaceName={workspace.name}
            />
            <DeleteWorkspace workspaceId={workspace.id} />
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const WorkspacePreferences = ({
  workspaceId,
  workspaceName,
}: {
  workspaceId: string
  workspaceName: string
}) => {
  const [open, setOpen] = useState(false)
  const closeDialog = () => setOpen(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <SettingsIcon />
          Preferences
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-base">Workspace Preferences</DialogTitle>
          <DialogDescription>Update your workspace name</DialogDescription>
        </DialogHeader>
        <UpdateWorkspace
          workspaceId={workspaceId}
          workspaceName={workspaceName}
          closeDialog={closeDialog}
        />
      </DialogContent>
    </Dialog>
  )
}

const UpdateWorkspace = ({
  workspaceId,
  workspaceName,
  closeDialog,
}: {
  workspaceId: string
  workspaceName: string
  closeDialog(): void
}) => {
  const form = useForm({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: { name: workspaceName },
  })
  const [isPending, setIsPending] = useState(false)
  const isFormDisabled = form.formState.isSubmitting || isPending
  const queryClient = useQueryClient()
  const router = useRouter()
  const onClose = () => {
    closeDialog()
    form.reset(undefined, { keepDirtyValues: true })
  }
  return (
    <form
      onSubmit={form.handleSubmit(async (data) => {
        setIsPending(true)
        try {
          const response = await updateWorkspace({
            data: { ...data, workspaceId },
          })
          if (response.failed) {
            toast.error('Failed to update workspace. try again.')
            return
          }
          toast.success('Workspace updated.')
          queryClient.invalidateQueries({
            queryKey: workspacesQueryKey,
            exact: true,
          })
          router.invalidate()
          onClose()
        } catch {
          toast.error('Failed to update workspace. try again.')
        } finally {
          setIsPending(false)
        }
      })}
    >
      <FieldContent className="gap-4">
        <TextInput control={form.control} name="name" label="Name" />
        <DialogFooter>
          <Button
            disabled={isFormDisabled}
            variant="outline"
            type="button"
            onClick={onClose}
          >
            Cancel
          </Button>
          <SubmitBtn disabled={isFormDisabled}>Save</SubmitBtn>
        </DialogFooter>
      </FieldContent>
    </form>
  )
}

const DeleteWorkspace = ({ workspaceId }: { workspaceId: string }) => {
  const navigate = useNavigate()
  const { isPending, deleteFn } = useDeleteWorkspace({
    workspaceId,
    onSuccess() {
      navigate({ to: '/workspace', replace: true })
    },
  })
  return (
    <DropdownMenuItem
      className="text-destructive hover:text-destructive!"
      disabled={isPending}
      onClick={deleteFn}
    >
      <TrashIcon className="text-inherit" />
      Delete Workspace
    </DropdownMenuItem>
  )
}
