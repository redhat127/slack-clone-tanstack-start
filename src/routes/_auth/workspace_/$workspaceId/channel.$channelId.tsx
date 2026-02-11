import { SubmitBtn } from '@/components/submit-btn'
import { TextInput } from '@/components/text-input'
import { Tooltip } from '@/components/tooltip'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { FieldGroup } from '@/components/ui/field'
import type { ChannelSelect } from '@/db/schema'
import { capitalizeWords, pageTitle } from '@/lib/utils'
import { channelsQueryKey } from '@/query-options/channel'
import { deleteChannel, getChannel, updateChannel } from '@/serverFn/channel'
import { createChannelSchema } from '@/zod-schema/channel/create-channel'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient } from '@tanstack/react-query'
import {
  createFileRoute,
  notFound,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { EditIcon, TrashIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

export const Route = createFileRoute(
  '/_auth/workspace_/$workspaceId/channel/$channelId',
)({
  component: RouteComponent,
  async loader({ params: { channelId, workspaceId } }) {
    const channel = await getChannel({ data: { channelId, workspaceId } })
    if (!channel) throw notFound()
    return { channel }
  },
  head({ loaderData }) {
    if (!loaderData) return {}
    return {
      meta: [
        {
          title: pageTitle(
            `Channel - ${capitalizeWords(loaderData.channel.name)}`,
          ),
        },
      ],
    }
  },
})

function RouteComponent() {
  const { channel } = Route.useLoaderData()
  return (
    <div className="bg-white min-h-screen ml-64 p-4">
      <div className="flex flex-col gap-1">
        <h1 className="font-bold text-2xl capitalize text-gray-800">
          Channel: {channel.name}
        </h1>
        {channel.isWorkspaceAdmin && (
          <div className="flex items-center gap-1.5">
            <EditChannel channel={channel} />
            <DeleteChannel channel={channel} />
          </div>
        )}
      </div>
    </div>
  )
}

const EditChannel = ({ channel }: { channel: ChannelSelect }) => {
  const form = useForm({
    resolver: zodResolver(createChannelSchema),
    defaultValues: {
      name: channel.name,
    },
  })
  const [isPending, setIsPending] = useState(false)
  const isFormDisabled = form.formState.isSubmitting || isPending
  const [open, setOpen] = useState(false)
  const onClose = () => {
    setOpen(false)
  }
  useEffect(() => {
    if (open) {
      form.reset({ name: channel.name })
    }
  }, [open, channel.name])
  const queryKey = channelsQueryKey(channel.workspaceId)
  const router = useRouter()
  const queryClient = useQueryClient()
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Tooltip
        trigger={
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="icon-xs">
              <EditIcon />
            </Button>
          </DialogTrigger>
        }
        content="Edit"
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-base">Edit Channel</DialogTitle>
          <DialogDescription>
            Use form below to edit your channel information
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(async (data) => {
            setIsPending(true)
            try {
              const response = await updateChannel({
                data: {
                  ...data,
                  workspaceId: channel.workspaceId,
                  channelId: channel.id,
                },
              })
              if (response.failed) {
                toast.error('Failed to update channel. try again.')
                return
              }
              toast.success('Channel updated.')
              queryClient.invalidateQueries({
                queryKey,
                exact: true,
              })
              onClose()
              router.invalidate()
            } catch {
              toast.error('Failed to update channel. try again.')
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
                onClick={onClose}
                variant="outline"
                disabled={isFormDisabled}
              >
                Cancel
              </Button>
              <SubmitBtn disabled={isFormDisabled}>Save</SubmitBtn>
            </DialogFooter>
          </FieldGroup>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const DeleteChannel = ({ channel }: { channel: ChannelSelect }) => {
  const [isPending, setIsPending] = useState(false)
  const queryClient = useQueryClient()
  const workspaceId = channel.workspaceId
  const queryKey = channelsQueryKey(workspaceId)
  const navigate = useNavigate()
  return (
    <Tooltip
      trigger={
        <Button
          disabled={isPending}
          type="button"
          variant="outline"
          size="icon-xs"
          className="text-destructive"
          onClick={async () => {
            if (!confirm('Are you sure you want to delete this channel?')) {
              return
            }
            setIsPending(true)
            try {
              const response = await deleteChannel({
                data: {
                  workspaceId,
                  channelId: channel.id,
                },
              })
              if (response.failed) {
                toast.error('Failed to delete channel. try again.')
                return
              }
              toast.success('Channel deleted.')
              queryClient.invalidateQueries({
                queryKey,
                exact: true,
              })
              navigate({
                to: '/workspace/$workspaceId',
                params: { workspaceId },
              })
            } catch {
              toast.error('Failed to delete channel. try again.')
            } finally {
              setIsPending(false)
            }
          }}
        >
          <TrashIcon />
        </Button>
      }
      content="Delete"
    />
  )
}
