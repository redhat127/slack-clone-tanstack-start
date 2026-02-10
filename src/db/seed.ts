import { auth } from '@/lib/auth'
import { db } from '.'
import { user } from './schema'

async function main() {
  console.log('🚀 deleting all users...')

  await db.delete(user)

  console.log('✅ all users deleted.')

  console.log('🚀 adding users...')

  await Promise.all([
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

  console.log('✅ users have been added.')
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
