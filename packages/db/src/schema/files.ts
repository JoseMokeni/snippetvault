import { pgTable, text, timestamp, integer, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { snippets } from './snippets'

export const files = pgTable('files', {
  id: text('id').primaryKey(),
  snippetId: text('snippet_id')
    .notNull()
    .references(() => snippets.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  content: text('content').notNull(),
  language: text('language').notNull(),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  snippetIdIdx: index('idx_files_snippet_id').on(table.snippetId),
  orderIdx: index('idx_files_order').on(table.snippetId, table.order),
}))

export const filesRelations = relations(files, ({ one }) => ({
  snippet: one(snippets, {
    fields: [files.snippetId],
    references: [snippets.id],
  }),
}))
