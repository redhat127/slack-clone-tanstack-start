import type { ReactNode } from 'react'
import { UserDropdown } from '../user-dropdown'

export const WorkspaceLayout = ({
  asideChildren,
  children,
}: {
  asideChildren: ReactNode
  children: ReactNode
}) => {
  return (
    <div className="flex min-h-screen">
      <aside className="bg-white border-r p-4 w-16 flex flex-col items-center justify-between fixed top-0 left-0 h-full">
        {asideChildren}
        <UserDropdown />
      </aside>
      <div className="flex-1 ml-16">{children}</div>
    </div>
  )
}
