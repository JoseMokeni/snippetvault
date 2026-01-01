import { pgTable, text, timestamp, boolean, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'
import { files } from './files'
import { variables } from './variables'
import { snippetsTags } from './tags'

export const snippets = pgTable('snippets', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  instructions: text('instructions'),
  language: text('language').notNull(),
  isFavorite: boolean('is_favorite').notNull().default(false),
  isPublic: boolean('is_public').notNull().default(false),
  slug: text('slug'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_snippets_user_id').on(table.userId),
  languageIdx: index('idx_snippets_language').on(table.language),
  createdAtIdx: index('idx_snippets_created_at').on(table.createdAt),
  updatedAtIdx: index('idx_snippets_updated_at').on(table.updatedAt),
}))

export const snippetsRelations = relations(snippets, ({ one, many }) => ({
  user: one(users, {
    fields: [snippets.userId],
    references: [users.id],
  }),
  files: many(files),
  variables: many(variables),
  snippetsTags: many(snippetsTags),
}))
