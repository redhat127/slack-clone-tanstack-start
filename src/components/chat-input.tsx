import type { Messages } from '@/query-options/message'
import { messagesQueryKey } from '@/query-options/message'
import { ALLOWED_IMAGE_MIMES } from '@/routes/api/upload/-utils'
import { createMessage } from '@/serverFn/message'
import data from '@emoji-mart/data'
import Picker from '@emoji-mart/react'
import { useQueryClient } from '@tanstack/react-query'
import { useParams } from '@tanstack/react-router'
import { ImageIcon, Loader2, Smile } from 'lucide-react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Tooltip } from './tooltip'
import { Button } from './ui/button'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'

// Register custom blot once at module level
const ImageBlot = Quill.import('formats/image') as any

class LinkedImage extends ImageBlot {
  static blotName = 'linkedImage'
  static tagName = 'a'

  static create(value: { src: string; href: string }) {
    const node = document.createElement('a')
    node.setAttribute('href', value.href)
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
    const img = document.createElement('img')
    img.setAttribute('src', value.src)
    img.className = 'max-w-[400px] rounded cursor-pointer'
    node.appendChild(img)
    return node
  }

  static value(node: HTMLElement) {
    return {
      src: node.querySelector('img')?.getAttribute('src'),
      href: node.getAttribute('href'),
    }
  }
}

Quill.register(LinkedImage, true)

export const ChatInput = () => {
  const editorRef = useRef<HTMLDivElement>(null)
  const quillRef = useRef<Quill | null>(null)
  const [isPending, setIsPending] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const { workspaceId, channelId } = useParams({
    from: '/_auth/workspace_/$workspaceId/channel/$channelId',
  })
  const queryClient = useQueryClient()
  const initializedRef = useRef(false)
  const queryKey = messagesQueryKey(workspaceId, channelId)

  const getQuill = () => {
    const quill = quillRef.current ?? Quill.find(editorRef.current!)
    if (!(quill instanceof Quill) || isPending) return
    return quill
  }

  const handleSubmit = async () => {
    const quill = getQuill()
    if (!quill) return
    const delta = quill.getContents()
    const isEmpty = delta.ops.every(
      (op) => typeof op.insert === 'string' && op.insert.trim() === '',
    )
    if (isEmpty) return

    setIsPending(true)
    try {
      const body = JSON.stringify(delta)
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

  const handleImageSelect = async (file: File) => {
    const quill = getQuill()
    if (!quill) return

    setIsUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Failed to upload image.')
        return
      }

      const { path, previewPath } = json
      const index = quill.getSelection()?.index ?? quill.getLength()
      quill.insertEmbed(index, 'linkedImage', { src: previewPath, href: path })
      quill.setSelection(index + 1)
    } catch {
      toast.error('Failed to upload image.')
    } finally {
      setIsUploadingImage(false)
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
    }
  }, [])

  const handleSubmitRef = useRef(handleSubmit)
  useEffect(() => {
    handleSubmitRef.current = handleSubmit
  })

  const [open, setOpen] = useState(false)

  return (
    <div className="overflow-hidden">
      <div className="flex gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="mb-2"
            >
              <Smile />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0 border-none shadow-none">
            <Picker
              emojiSize={16}
              previewPosition="none"
              theme="light"
              data={data}
              onEmojiSelect={(data: { native: string }) => {
                setOpen(false)
                const quill = getQuill()
                if (!quill) return
                quill.insertText(quill.getSelection()?.index || 0, data.native)
              }}
            />
          </PopoverContent>
        </Popover>
        <PickImage
          onSelect={handleImageSelect}
          disabled={isPending || isUploadingImage}
          isUploading={isUploadingImage}
        />
      </div>
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
    [&_.ql-editor]:overflow-y-auto
    [&_.ql-editor_img]:inline
    [&_.ql-editor_img]:max-w-50
    [&_.ql-editor_img]:mr-2
    [&_.ql-editor_img]:mb-2
    [&_.ql-editor_img]:align-middle"
      />
    </div>
  )
}

type PickImageProps = {
  onSelect: (file: File) => void
  disabled: boolean
  isUploading: boolean
}

const PickImage = ({ onSelect, disabled, isUploading }: PickImageProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <Tooltip
        trigger={
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
          >
            {isUploading ? <Loader2 className="animate-spin" /> : <ImageIcon />}
          </Button>
        }
        content="Pick Image"
      />
      <input
        className="sr-only"
        ref={inputRef}
        type="file"
        accept={ALLOWED_IMAGE_MIMES.join(',')}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onSelect(file)
          e.target.value = ''
        }}
      />
    </>
  )
}
