import { auth } from '@/lib/auth'
import { db } from '.'
import { member, user, workspace } from './schema'

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

  console.log('🚀 adding 4 workspaces (2 per user)...')

  const workspaces = await db
    .insert(workspace)
    .values([
      // Dave's 2 creator workspaces
      {
        name: 'nimbus hub',
        userId: dave.id,
      },
      {
        name: 'pixel forge',
        userId: dave.id,
      },

      // Rock's 2 creator workspaces
      {
        name: 'horizon collective',
        userId: rock.id,
      },
      {
        name: 'aurora space',
        userId: rock.id,
      },
    ])
    .returning()

  console.log(`✅ total of ${workspaces.length} workspaces have been added.`)

  console.log('🚀 adding members to workspaces...')

  const memberValues = [
    // Dave's Workspace 1: Dave creator/admin, Rock admin
    { userId: dave.id, workspaceId: workspaces[0].id, role: 'admin' as const },
    { userId: rock.id, workspaceId: workspaces[0].id, role: 'admin' as const },

    // Dave's Workspace 2: Dave creator/admin, Rock member
    { userId: dave.id, workspaceId: workspaces[1].id, role: 'admin' as const },
    { userId: rock.id, workspaceId: workspaces[1].id, role: 'member' as const },

    // Rock's Workspace 1: Rock creator/admin, Dave admin
    { userId: rock.id, workspaceId: workspaces[2].id, role: 'admin' as const },
    { userId: dave.id, workspaceId: workspaces[2].id, role: 'admin' as const },

    // Rock's Workspace 2: Rock creator/admin, Dave member
    { userId: rock.id, workspaceId: workspaces[3].id, role: 'admin' as const },
    { userId: dave.id, workspaceId: workspaces[3].id, role: 'member' as const },
  ]

  const memberResult = await db.insert(member).values(memberValues)

  console.log(`✅ total of ${memberResult.rowCount} members have been added.`)

  console.log('\n📊 Summary:')
  console.log('Total workspaces: 4')
  console.log(
    "Dave: 2 creator (admin), 1 admin (on Rock's workspace), 1 member (on Rock's workspace)",
  )
  console.log(
    "Rock: 2 creator (admin), 1 admin (on Dave's workspace), 1 member (on Dave's workspace)",
  )
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
