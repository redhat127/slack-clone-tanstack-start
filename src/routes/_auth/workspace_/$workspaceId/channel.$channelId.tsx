import { capitalizeWords, pageTitle } from '@/lib/utils'
import { getChannel } from '@/serverFn/channel'
import { createFileRoute, notFound } from '@tanstack/react-router'

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
      <h1 className="font-bold text-2xl capitalize text-gray-800">
        Channel: {channel.name}
      </h1>
    </div>
  )
}
