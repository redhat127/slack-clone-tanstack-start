import type { ComponentProps } from 'react'
import { Button } from './ui/button'
import { LoadingSwap } from './ui/loading-swap'

export const SubmitBtn = (props: ComponentProps<typeof Button>) => {
  return (
    <Button {...props} type="submit">
      <LoadingSwap isLoading={Boolean(props.disabled)}>
        {props.children}
      </LoadingSwap>
    </Button>
  )
}
