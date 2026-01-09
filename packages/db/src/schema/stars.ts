import { pgTable, text, timestamp, primaryKey, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'
import { snippets } from './snippets'

export const stars = pgTable('stars', {
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  snippetId: text('snippet_id')
    .notNull()
    .references(() => snippets.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.snippetId] }),
  userIdIdx: index('idx_stars_user_id').on(table.userId),
  snippetIdIdx: index('idx_stars_snippet_id').on(table.snippetId),
}))

export const starsRelations = relations(stars, ({ one }) => ({
  user: one(users, {
    fields: [stars.userId],
    references: [users.id],
  }),
  snippet: one(snippets, {
    fields: [stars.snippetId],
    references: [snippets.id],
  }),
}))
