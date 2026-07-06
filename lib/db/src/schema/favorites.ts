import { pgTable, integer, timestamp, uuid, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { dramasTable } from "./dramas";

export const favoritesTable = pgTable("favorites", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  dramaId: uuid("drama_id").notNull().references(() => dramasTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique().on(table.userId, table.dramaId),
]);

export const insertFavoriteSchema = createInsertSchema(favoritesTable).omit({ id: true, createdAt: true });
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type FavoriteRow = typeof favoritesTable.$inferSelect;

export const watchProgressTable = pgTable("watch_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  dramaId: uuid("drama_id").notNull().references(() => dramasTable.id, { onDelete: "cascade" }),
  lastEpisode: integer("last_episode").notNull(),
  position: integer("position").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique().on(table.userId, table.dramaId),
]);

export const insertWatchProgressSchema = createInsertSchema(watchProgressTable).omit({ id: true, updatedAt: true });
export type InsertWatchProgress = z.infer<typeof insertWatchProgressSchema>;
export type WatchProgressRow = typeof watchProgressTable.$inferSelect;
