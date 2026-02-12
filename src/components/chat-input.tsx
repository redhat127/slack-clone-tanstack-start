import type { Messages } from '@/query-options/message'
import { messagesQueryKey } from '@/query-options/message'
import { createMessage } from '@/serverFn/message'
import { useQueryClient } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

export const ChatInput = () => {
  const editorRef = useRef<HTMLDivElement>(null)
  const quillRef = useRef<Quill | null>(null)
  const [isPending, setIsPending] = useState(false)
  const { workspaceId, channelId } = useParams({
    from: '/_auth/workspace_/$workspaceId/channel/$channelId',
  })
  const queryClient = useQueryClient()
  const initializedRef = useRef(false)
  const queryKey = messagesQueryKey(workspaceId, channelId)
  const handleSubmit = async () => {
    const quill = quillRef.current ?? Quill.find(editorRef.current!)
    if (!(quill instanceof Quill) || isPending) return
    const delta = quill.getContents()
    const isEmpty = delta.ops.every(
      (op) => typeof op.insert === 'string' && op.insert.trim() === '',
    )
    if (isEmpty) return
    const body = JSON.stringify(delta)
    setIsPending(true)
    try {
      const response = await createMessage({
        data: { body, channelId, workspaceId },
      })
      if (response.failed) {
        toast.error('Failed to send message. Try again.')
        return
      }
      quill.setContents([])
      toast.success('Message added.')
      const { newMessage } = response
      if (newMessage) {
        queryClient.setQueryData<Messages>(queryKey, (old) => [
          ...(old ?? []),
          newMessage,
        ])
      }
    } catch {
      toast.error('Failed to send message. Try again.')
    } finally {
      setIsPending(false)
    }
  }
  useEffect(() => {
    if (!editorRef.current || initializedRef.current) return
    initializedRef.current = true

    quillRef.current = new Quill(editorRef.current, {
      theme: 'snow',
      placeholder: 'Message...',
      modules: {
        toolbar: [
          ['bold', 'italic', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
        ],
        keyboard: {
          bindings: {
            enter: {
              key: 'Enter',
              shiftKey: false,
              handler: () => {
                handleSubmitRef.current()
                return false
              },
            },
          },
        },
      },
    })

    return () => {
      quillRef.current = null
      if (editorRef.current) {
        editorRef.current.innerHTML = ''
      }
      // intentionally not resetting initializedRef here
    }
  }, [])
  const handleSubmitRef = useRef(handleSubmit)
  useEffect(() => {
    handleSubmitRef.current = handleSubmit
  })
  return (
    <div className="rounded-md border border-slate-200 shadow-sm overflow-hidden">
      <div
        ref={editorRef}
        className="bg-white
          [&_.ql-toolbar]:border-0
          [&_.ql-toolbar]:border-b
          [&_.ql-toolbar]:border-slate-200
          [&_.ql-container]:border-0
          [&_.ql-editor]:min-h-30
          [&_.ql-editor]:text-sm
          [&_.ql-editor]:text-slate-800
          [&_.ql-editor.ql-blank::before]:text-slate-400
          [&_.ql-editor.ql-blank::before]:not-italic
          [&_.ql-editor]:max-h-32
          [&_.ql-editor]:overflow-y-auto"
      />
    </div>
  )
}
