// src/lib/emit.ts
export const emitToChannel = async (
  channelId: string,
  event: string,
  data: unknown,
  excludeUserId?: string,
) => {
  await fetch(
    `${process.env.SOCKET_INTERNAL_URL ?? 'http://localhost:3001'}/emit`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-secret': process.env.SOCKET_SECRET ?? 'secret',
      },
      body: JSON.stringify({ channelId, event, data, excludeUserId }),
    },
  )
}
