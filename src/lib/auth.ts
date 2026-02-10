import { db } from '@/db'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { tanstackStartCookies } from 'better-auth/tanstack-start'

if (!process.env.BETTER_AUTH_URL) {
  throw new Error('set env variable BETTER_AUTH_URL!')
}

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
    requireEmailVerification: false,
    maxPasswordLength: 50,
    minPasswordLength: 10,
  },
  plugins: [tanstackStartCookies()],
})
