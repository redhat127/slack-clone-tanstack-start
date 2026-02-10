import { getRouteApi } from '@tanstack/react-router'
import { SettingsIcon, TrashIcon } from 'lucide-react'
import { Tooltip } from '../tooltip'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'

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
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <WorkspacePreferences />
        </DropdownMenuItem>
        <DropdownMenuItem className="text-destructive hover:text-destructive!">
          <DeleteWorkspace />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const WorkspacePreferences = () => {
  return (
    <>
      <SettingsIcon />
      Preferences
    </>
  )
}

const DeleteWorkspace = () => {
  return (
    <>
      <TrashIcon className="text-inherit" />
      Delete Workspace
    </>
  )
}
