import { pgTable, text, timestamp, primaryKey, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'
import { snippets } from './snippets'

export const tags = pgTable('tags', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color'),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_tags_user_id').on(table.userId),
  nameIdx: index('idx_tags_name').on(table.userId, table.name),
}))

export const snippetsTags = pgTable('snippets_tags', {
  snippetId: text('snippet_id')
    .notNull()
    .references(() => snippets.id, { onDelete: 'cascade' }),
  tagId: text('tag_id')
    .notNull()
    .references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.snippetId, table.tagId] }),
  snippetIdIdx: index('idx_snippets_tags_snippet').on(table.snippetId),
  tagIdIdx: index('idx_snippets_tags_tag').on(table.tagId),
}))

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, {
    fields: [tags.userId],
    references: [users.id],
  }),
  snippetsTags: many(snippetsTags),
}))

export const snippetsTagsRelations = relations(snippetsTags, ({ one }) => ({
  snippet: one(snippets, {
    fields: [snippetsTags.snippetId],
    references: [snippets.id],
  }),
  tag: one(tags, {
    fields: [snippetsTags.tagId],
    references: [tags.id],
  }),
}))
