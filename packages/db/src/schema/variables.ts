import { pgTable, text, integer, timestamp, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { snippets } from './snippets'

export const variables = pgTable('variables', {
  id: text('id').primaryKey(),
  snippetId: text('snippet_id')
    .notNull()
    .references(() => snippets.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  defaultValue: text('default_value').notNull(),
  description: text('description'),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  snippetIdIdx: index('idx_variables_snippet_id').on(table.snippetId),
}))

export const variablesRelations = relations(variables, ({ one }) => ({
  snippet: one(snippets, {
    fields: [variables.snippetId],
    references: [snippets.id],
  }),
}))
