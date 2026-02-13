import { ChatInput } from '@/components/chat-input'
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
import { Skeleton } from '@/components/ui/skeleton'
import type { ChannelSelect } from '@/db/schema'
import { useSocket } from '@/hooks/use-socket'
import { capitalizeWords, pageTitle } from '@/lib/utils'
import { channelsQueryKey } from '@/query-options/channel'
import { messagesQueryOptions } from '@/query-options/message'
import { deleteChannel, getChannel, updateChannel } from '@/serverFn/channel'
import { deleteMessage, getMessages } from '@/serverFn/message'
import { createChannelSchema } from '@/zod-schema/channel/create-channel-schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import {
  ClientOnly,
  createFileRoute,
  notFound,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { EditIcon, TrashIcon } from 'lucide-react'
import Quill from 'quill'
import { Suspense, useEffect, useRef, useState } from 'react'
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
  const isSelfMessageRef = useRef(false) // ← add this

  return (
    <div className="flex flex-col h-svh ml-64">
      <div className="flex-none px-4 pt-4 bg-white border-b pb-4">
        <h1 className="font-bold text-2xl capitalize text-gray-800">
          Channel: {channel.name}
        </h1>
        {channel.isWorkspaceAdmin && (
          <div className="flex items-center gap-1.5 mt-1">
            <EditChannel channel={channel} />
            <DeleteChannel channel={channel} />
          </div>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-auto p-4 bg-white">
        <MessagesList channel={channel} isSelfMessageRef={isSelfMessageRef} />
      </div>
      <div className="flex-none p-4 bg-white border-t">
        <ClientOnly fallback={<ChatInputFallback />}>
          <ChatInput
            onMessageSent={() => {
              isSelfMessageRef.current = true
            }}
          />
        </ClientOnly>
      </div>
    </div>
  )
}

const MessagesList = ({
  channel,
  isSelfMessageRef,
}: {
  channel: ChannelSelect
  isSelfMessageRef: React.RefObject<boolean>
}) => {
  return (
    <Suspense fallback={<MessagesListSkeleton />}>
      <MessageListSuspense
        workspaceId={channel.workspaceId}
        channelId={channel.id}
        isSelfMessageRef={isSelfMessageRef}
      />
    </Suspense>
  )
}

const MessagesListSkeleton = () => {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          {/* Avatar */}
          <Skeleton className="shrink-0 w-9 h-9 rounded-full" />
          {/* Content */}
          <div className="flex flex-col gap-2 flex-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-3.5 w-full max-w-sm" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

const MessageListSuspense = ({
  workspaceId,
  channelId,
  isSelfMessageRef,
}: {
  workspaceId: string
  channelId: string
  isSelfMessageRef: React.RefObject<boolean>
}) => {
  const getChannelMessagesFn = useServerFn(getMessages)
  const deleteMessageFn = useServerFn(deleteMessage)
  const queryClient = useQueryClient()
  const queryOptions = messagesQueryOptions(workspaceId, channelId)

  const { data: messages } = useSuspenseQuery({
    ...queryOptions,
    async queryFn({ signal }) {
      return (
        await getChannelMessagesFn({ signal, data: { workspaceId, channelId } })
      ).messages
    },
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const prevLengthRef = useRef<number | null>(null)

  useEffect(() => {
    // on first load, just set the initial length without scrolling
    if (prevLengthRef.current === null) {
      prevLengthRef.current = messages.length
      return
    }

    // scroll if current user sent the message
    if (isSelfMessageRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      isSelfMessageRef.current = false
      prevLengthRef.current = messages.length
      return
    }

    // new message arrived from someone else
    if (messages.length > prevLengthRef.current) {
      // find the scrollable container (the div with overflow-auto in RouteComponent)
      const end = messagesEndRef.current
      const container = end?.closest('.overflow-auto') as HTMLElement | null
      if (container) {
        const isNearBottom =
          container.scrollHeight -
            container.scrollTop -
            container.clientHeight <
          200
        if (isNearBottom) {
          end?.scrollIntoView({ behavior: 'smooth' })
        }
      }
    }

    prevLengthRef.current = messages.length
  }, [messages])

  const handleDelete = async (messageId: string) => {
    if (!confirm('Delete this message?')) return
    const response = await deleteMessageFn({
      data: { messageId, workspaceId, channelId },
    })
    if (response.failed) {
      toast.error('Failed to delete message.')
      return
    }
    toast.success('Message deleted.')
    queryClient.invalidateQueries({
      queryKey: queryOptions.queryKey,
      exact: true,
    })
  }

  const socket = useSocket()

  useEffect(() => {
    socket.emit('channel:join', channelId)

    socket.on('channel:newMessage', () => {
      queryClient.invalidateQueries({
        queryKey: queryOptions.queryKey,
        exact: true,
      })
    })

    socket.on('channel:deleteMessage', () => {
      queryClient.invalidateQueries({
        queryKey: queryOptions.queryKey,
        exact: true,
      })
    })

    return () => {
      socket.emit('channel:leave', channelId)
      socket.off('channel:newMessage')
      socket.off('channel:deleteMessage')
    }
  }, [channelId])

  if (messages.length === 0) {
    return (
      <p className="text-muted-foreground text-sm italic">No message found.</p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {messages.map((message) => (
        <div key={message.id} className="group flex items-start gap-3">
          {/* Avatar */}
          <div className="shrink-0 w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-sm font-semibold text-slate-600 uppercase">
            {message.member.user.image ? (
              <img
                src={message.member.user.image}
                alt={message.member.user.name}
                className="w-9 h-9 rounded-full object-cover"
              />
            ) : (
              message.member.user.name[0]
            )}
          </div>

          {/* Content */}
          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-sm text-slate-800">
                {message.member.user.name}
              </span>
              <span className="text-xs text-slate-400">
                {new Date(message.createdAt).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <ClientOnly>
              <MessageBody body={message.body} />
            </ClientOnly>
          </div>

          {/* Delete button */}
          {message.member.canDelete && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
              <Tooltip
                trigger={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="text-destructive"
                    onClick={() => handleDelete(message.id)}
                  >
                    <TrashIcon />
                  </Button>
                }
                side="left"
                content="Delete message"
              />
            </div>
          )}
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  )
}

const MessageBody = ({ body }: { body: string }) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return
    try {
      const delta = JSON.parse(body)
      const quill = new Quill(document.createElement('div'))
      quill.setContents(delta)
      containerRef.current.innerHTML = quill.root.innerHTML
    } catch {
      containerRef.current.textContent = body
    }
  }, [body])

  return (
    <div
      ref={containerRef}
      className="text-sm text-slate-700 leading-relaxed
        [&_strong]:font-semibold
        [&_em]:italic
        [&_s]:line-through
        [&_pre]:bg-slate-100
        [&_pre]:rounded
        [&_pre]:p-2
        [&_pre]:text-xs
        [&_ol]:list-decimal
        [&_ol]:pl-4
        [&_ul]:list-disc
        [&_ul]:pl-4
        [&_img]:inline
        [&_img]:max-w-50
        [&_img]:mr-2
        [&_img]:mb-2
        [&_img]:align-middle
        [&_img]:rounded"
    />
  )
}

const ChatInputFallback = () => {
  return (
    <div className="border border-slate-200 overflow-hidden bg-white">
      <div className="h-10.5 border-b border-slate-200 px-3 flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded-sm" />
        <Skeleton className="h-4 w-4 rounded-sm" />
        <Skeleton className="h-4 w-4 rounded-sm" />
        <Skeleton className="h-4 w-4 rounded-sm" />
        <Skeleton className="h-4 w-4 rounded-sm" />
      </div>
      <div className="h-27.5 p-3 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-64" />
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
