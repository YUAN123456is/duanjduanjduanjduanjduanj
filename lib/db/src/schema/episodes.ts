import { pgTable, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { dramasTable } from "./dramas";

export const episodesTable = pgTable("episodes", {
  id: uuid("id").primaryKey().defaultRandom(),
  dramaId: uuid("drama_id").notNull().references(() => dramasTable.id, { onDelete: "cascade" }),
  episodeNumber: integer("episode_number").notNull(),
  title: text("title"),
  videoUrl: text("video_url").notNull(),
  duration: integer("duration").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertEpisodeSchema = createInsertSchema(episodesTable).omit({ id: true, createdAt: true });
export type InsertEpisode = z.infer<typeof insertEpisodeSchema>;
export type EpisodeRow = typeof episodesTable.$inferSelect;
