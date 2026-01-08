import { pgTable, text, timestamp, boolean, index, uniqueIndex, integer } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'
import { files } from './files'
import { variables } from './variables'
import { snippetsTags } from './tags'
import { stars } from './stars'

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
  forkedFromId: text('forked_from_id'),
  starCount: integer('star_count').notNull().default(0),
  forkCount: integer('fork_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_snippets_user_id').on(table.userId),
  languageIdx: index('idx_snippets_language').on(table.language),
  createdAtIdx: index('idx_snippets_created_at').on(table.createdAt),
  updatedAtIdx: index('idx_snippets_updated_at').on(table.updatedAt),
  uniqueUserTitle: uniqueIndex('idx_snippets_user_title_unique').on(table.userId, table.title),
  isPublicIdx: index('idx_snippets_is_public').on(table.isPublic),
  starCountIdx: index('idx_snippets_star_count').on(table.starCount),
}))

export const snippetsRelations = relations(snippets, ({ one, many }) => ({
  user: one(users, {
    fields: [snippets.userId],
    references: [users.id],
  }),
  forkedFrom: one(snippets, {
    fields: [snippets.forkedFromId],
    references: [snippets.id],
    relationName: 'forks',
  }),
  forks: many(snippets, {
    relationName: 'forks',
  }),
  files: many(files),
  variables: many(variables),
  snippetsTags: many(snippetsTags),
  stars: many(stars),
}))
