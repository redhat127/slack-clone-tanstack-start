import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core'
import { customAlphabet, nanoid } from 'nanoid'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

export type UserSelect = Omit<InferSelectModel<typeof user>, 'image'> & {
  image?: string | null | undefined
}

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_userId_idx').on(table.userId)],
)

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('account_userId_idx').on(table.userId)],
)

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
)

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  workspaces: many(workspace),
  members: many(member),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))

const generateJoinCode = customAlphabet(
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  8,
)

export const workspace = pgTable(
  'workspace',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    name: text('name').notNull(),
    joinCode: text('join_code')
      .notNull()
      .unique()
      .$defaultFn(() => generateJoinCode()),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('workspace_userId_idx').on(table.userId)],
)

export type WorkspaceSelect = InferSelectModel<typeof workspace>

export const workspaceRelations = relations(workspace, ({ one, many }) => ({
  user: one(user, {
    fields: [workspace.userId],
    references: [user.id],
  }),
  members: many(member),
  channels: many(channel),
}))

export const member = pgTable(
  'member',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    role: text('role', { enum: ['admin', 'member'] })
      .notNull()
      .default('member'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspace.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    unique('member_userId_workspaceId_unique_idx').on(
      table.userId,
      table.workspaceId,
    ),
  ],
)

export const memberRelations = relations(member, ({ one }) => ({
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
  workspace: one(workspace, {
    fields: [member.workspaceId],
    references: [workspace.id],
  }),
}))

export const channel = pgTable(
  'channel',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    name: text('name').notNull(),
    workspaceId: text('workspace_id')
      .notNull()
      .references(() => workspace.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('channel_workspaceId_idx').on(table.workspaceId)],
)

export type ChannelSelect = InferSelectModel<typeof channel>

export const channelRelations = relations(channel, ({ one }) => ({
  workspace: one(workspace, {
    fields: [channel.workspaceId],
    references: [workspace.id],
  }),
}))

export const message = pgTable(
  'message',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => nanoid()),
    body: text('body').notNull(),
    deleted: boolean('deleted').default(false).notNull(),
    memberId: text('member_id')
      .notNull()
      .references(() => member.id, { onDelete: 'cascade' }),
    channelId: text('channel_id')
      .notNull()
      .references(() => channel.id, { onDelete: 'cascade' }),
    parentMessageId: text('parent_message_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('message_channel_id_created_at_idx').on(
      table.channelId,
      table.createdAt,
    ),
    index('message_parent_message_id_created_at_idx')
      .on(table.parentMessageId, table.createdAt)
      .where(sql`parent_message_id IS NOT NULL`),
  ],
)

export type MessageSelect = InferSelectModel<typeof message>
export type MessageInsert = InferInsertModel<typeof message>

export const messageRelations = relations(message, ({ one, many }) => ({
  member: one(member, {
    fields: [message.memberId],
    references: [member.id],
  }),
  channel: one(channel, {
    fields: [message.channelId],
    references: [channel.id],
  }),
  parentMessage: one(message, {
    fields: [message.parentMessageId],
    references: [message.id],
    relationName: 'thread',
  }),
  replies: many(message, { relationName: 'thread' }),
}))
