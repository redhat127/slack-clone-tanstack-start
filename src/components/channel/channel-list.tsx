import { channelsQueryKey, channelsQueryOptions } from '@/query-options/channel'
import { createChannel, getWorkspaceChannels } from '@/serverFn/channel'
import { createChannelSchema } from '@/zod-schema/channel/create-channel'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { HashIcon, PlusIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Suspense, useState } from 'react'
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
import { FieldGroup } from '../ui/field'
import { Skeleton } from '../ui/skeleton'

export const ChannelList = ({ workspaceId }: { workspaceId: string }) => {
  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-bold text-sm flex items-center gap-1.5 text-gray-800">
            <HashIcon className="size-4" />
            Channels
          </h2>
          <CreateChannelDialog
            workspaceId={workspaceId}
            trigger={
              <Tooltip
                trigger={
                  <DialogTrigger asChild>
                    <Button type="button" size="icon-xs" variant="outline">
                      <PlusIcon />
                    </Button>
                  </DialogTrigger>
                }
                side="right"
                content="Create Channel"
              />
            }
          />
        </div>
        <Suspense fallback={<ChannelListSkeleton />}>
          <ChannelListSuspense workspaceId={workspaceId} />
        </Suspense>
      </div>
    </>
  )
}

const CreateChannelDialog = ({
  trigger,
  workspaceId,
}: {
  trigger: ReactNode
  workspaceId: string
}) => {
  const [open, setOpen] = useState(false)
  const closeDialog = () => setOpen(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger}
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-base">Create Channel</DialogTitle>
          <DialogDescription>
            Provider a name to create channel
          </DialogDescription>
        </DialogHeader>
        <CreateChannelForm
          workspaceId={workspaceId}
          closeDialog={closeDialog}
        />
      </DialogContent>
    </Dialog>
  )
}

const CreateChannelForm = ({
  workspaceId,
  closeDialog,
}: {
  workspaceId: string
  closeDialog: () => void
}) => {
  const form = useForm({
    resolver: zodResolver(createChannelSchema),
    defaultValues: {
      name: '',
    },
  })
  const [isPending, setIsPending] = useState(false)
  const isFormDisabled = form.formState.isSubmitting || isPending
  const onClose = () => {
    closeDialog()
    form.reset()
  }
  const queryClient = useQueryClient()
  const queryKey = channelsQueryKey(workspaceId)
  const navigate = useNavigate()
  return (
    <form
      onSubmit={form.handleSubmit(async (data) => {
        setIsPending(true)
        try {
          const response = await createChannel({
            data: { ...data, workspaceId },
          })
          if (response.failed) {
            toast.error('Failed to create channel. try again.')
            return
          }
          toast.success('Channel created.')
          queryClient.invalidateQueries({
            queryKey,
            exact: true,
          })
          closeDialog()
          navigate({
            to: '/workspace/$workspaceId/channel/$channelId',
            params: {
              workspaceId,
              channelId: response.newChannelId,
            },
          })
        } catch {
          toast.error('Failed to create channel. try again.')
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
          <SubmitBtn disabled={isFormDisabled}>Create</SubmitBtn>
        </DialogFooter>
      </FieldGroup>
    </form>
  )
}

const ChannelListSuspense = ({ workspaceId }: { workspaceId: string }) => {
  const getWorkspaceChannelsFn = useServerFn(getWorkspaceChannels)
  const queryOptions = channelsQueryOptions(workspaceId)
  const { data: channels } = useSuspenseQuery({
    ...queryOptions,
    async queryFn({ signal }) {
      return (
        await getWorkspaceChannelsFn({
          signal,
          data: { workspaceId },
        })
      ).channels
    },
  })
  const navigate = useNavigate()
  return channels.length > 0 ? (
    <div className="flex flex-col gap-1">
      {channels.map((channel) => (
        <button
          onClick={() => {
            navigate({
              to: '/workspace/$workspaceId/channel/$channelId',
              params: {
                workspaceId,
                channelId: channel.id,
              },
            })
          }}
          key={channel.id}
          className="hover:bg-gray-100 transition-colors p-1 px-2 rounded w-full text-left"
        >
          <p className="text-sm flex items-center gap-1.5">
            <HashIcon className="size-3" />
            {channel.name}
          </p>
        </button>
      ))}
    </div>
  ) : (
    <p className="text-sm italic text-muted-foreground">No channel found.</p>
  )
}

const ChannelListSkeleton = () => {
  return (
    <div className="flex flex-col gap-1">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="p-1 px-2 rounded w-full">
          <div className="flex items-center gap-1.5">
            <Skeleton className="size-3" />
            <Skeleton className="h-3.5 w-full" />
          </div>
        </div>
      ))}
    </div>
  )
}
