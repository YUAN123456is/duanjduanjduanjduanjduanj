import { pgTable, integer, timestamp, uuid, date, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { dramasTable } from "./dramas";

export const unlockedEpisodesTable = pgTable("unlocked_episodes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  dramaId: uuid("drama_id").notNull().references(() => dramasTable.id, { onDelete: "cascade" }),
  episodeNumber: integer("episode_number").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  unique().on(table.userId, table.dramaId, table.episodeNumber),
]);

export const insertUnlockedEpisodeSchema = createInsertSchema(unlockedEpisodesTable).omit({ id: true, createdAt: true });
export type InsertUnlockedEpisode = z.infer<typeof insertUnlockedEpisodeSchema>;
export type UnlockedEpisodeRow = typeof unlockedEpisodesTable.$inferSelect;

export const dailyUnlockCountersTable = pgTable("daily_unlock_counters", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  unlockDate: date("unlock_date", { mode: "string" }).notNull(),
  count: integer("count").notNull().default(0),
}, (table) => [
  unique().on(table.userId, table.unlockDate),
]);

export const insertDailyUnlockCounterSchema = createInsertSchema(dailyUnlockCountersTable).omit({ id: true });
export type InsertDailyUnlockCounter = z.infer<typeof insertDailyUnlockCounterSchema>;
export type DailyUnlockCounterRow = typeof dailyUnlockCountersTable.$inferSelect;
