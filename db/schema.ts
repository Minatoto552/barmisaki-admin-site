import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const adminUsers = sqliteTable('admin_users', {
  userId: text('user_id').primaryKey(),
  email: text('email').notNull(),
  createdAt: text('created_at').notNull(),
});

export const casts = sqliteTable('casts', {
  id: text('id').primaryKey(), name: text('name').notNull(), category: text('category').notNull(),
  role: text('role').notNull(), imageUrl: text('image_url').notNull().default(''),
  xUrl: text('x_url').notNull().default(''), favorite: text('favorite').notNull().default(''),
  message: text('message').notNull().default(''), isPickup: integer('is_pickup', { mode: 'boolean' }).notNull().default(false),
  pickupOrder: integer('pickup_order'), createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(),
}, (table) => [index('idx_casts_category').on(table.category), index('idx_casts_pickup_order').on(table.isPickup, table.pickupOrder)]);

export const news = sqliteTable('news', {
  id: text('id').primaryKey(), title: text('title').notNull(), date: text('date').notNull(),
  thumbnailUrl: text('thumbnail_url').notNull().default(''), content: text('content').notNull().default(''),
  published: integer('published', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(), updatedAt: text('updated_at').notNull(),
}, (table) => [index('idx_news_published_date').on(table.published, table.date)]);
