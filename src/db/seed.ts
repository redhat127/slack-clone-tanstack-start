import { auth } from '@/lib/auth'
import { db } from '.'
import { user, workspace } from './schema'

async function main() {
  console.log('✅ seed started.')
  console.log('🚀 deleting all users...')

  await db.delete(user)

  console.log('✅ all users have been deleted.')

  console.log('🚀 adding users...')

  const users = await Promise.all([
    auth.api.signUpEmail({
      body: {
        name: 'dave',
        email: 'dave@gmail.com',
        password: 'password123456',
        image: 'https://avatars.githubusercontent.com/u/124599?v=4',
      },
    }),
    auth.api.signUpEmail({
      body: {
        name: 'rock',
        email: 'rock@gmail.com',
        password: 'password123456',
      },
    }),
  ])

  console.log(`✅ total of ${users.length} users have been added.`)

  const [{ user: dave }, { user: rock }] = users

  console.log('🚀 adding 3 workspace for each user...')

  const result = await db.insert(workspace).values([
    {
      name: 'nimbus hub',
      userId: dave.id,
    },
    {
      name: 'pixel forge',
      userId: dave.id,
    },
    {
      name: 'quantum labs',
      userId: dave.id,
    },
    {
      name: 'horizon collective',
      userId: rock.id,
    },
    {
      name: 'aurora space',
      userId: rock.id,
    },
    {
      name: 'catalyst crew',
      userId: rock.id,
    },
  ])

  console.log(`✅ total of ${result.rowCount} workspaces have been added.`)
}

main()
  .then(() => {
    console.log('✅ seed completed.')
    process.exit(0)
  })
  .catch((e) => {
    console.error('❌ error:', e)
    process.exit(1)
  })
