import type { UserSelect } from '@/db/schema'
import { getRouteApi } from '@tanstack/react-router'
import { UserIcon } from 'lucide-react'
import { LogoutForm } from './form/logout-form'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'

export const UserAvatar = ({ user }: { user: UserSelect }) => {
  return (
    <Avatar>
      {user.image && (
        <AvatarImage src={user.image} alt={`${user.name} avatar`} />
      )}
      <AvatarFallback className="bg-purple-600 text-white capitalize">
        {user.name.slice(0, 1)}
      </AvatarFallback>
    </Avatar>
  )
}

export const UserDropdown = () => {
  const user = getRouteApi('/_auth').useRouteContext().user!
  const userAvatar = <UserAvatar user={user} />
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full mt-auto">{userAvatar}</button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="right" align="end">
        <DropdownMenuLabel asChild>
          <div className="flex items-center gap-2">
            {userAvatar}
            <div className="max-w-32">
              <p className="truncate">{user.name}</p>
              <p className="truncate text-muted-foreground text-sm font-normal">
                {user.email}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <div className="w-full flex items-center gap-1.5 py-1.5 px-2">
            <UserIcon />
            Account
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem className="p-0">
          <LogoutForm />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
