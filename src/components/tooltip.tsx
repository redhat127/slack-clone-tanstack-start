// tooltip.tsx
import {
  Tooltip as ShadcnTooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ComponentProps, ReactNode } from 'react'

export const Tooltip = ({
  trigger,
  content,
  side,
  align,
}: {
  trigger: ReactNode
  content: ReactNode
  side?: ComponentProps<typeof TooltipContent>['side']
  align?: ComponentProps<typeof TooltipContent>['align']
}) => {
  return (
    <ShadcnTooltip>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent side={side} align={align}>
        <p>{content}</p>
      </TooltipContent>
    </ShadcnTooltip>
  )
}
