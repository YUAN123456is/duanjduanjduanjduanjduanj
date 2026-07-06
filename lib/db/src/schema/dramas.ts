import { pgTable, text, integer, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const dramasTable = pgTable("dramas", {
  id: uuid("id").primaryKey().defaultRandom(),
  titleEn: text("title_en").notNull(),
  titleEs: text("title_es"),
  titleZhTw: text("title_zh_tw"),
  coverUrl: text("cover_url").notNull(),
  description: text("description"),
  tags: text("tags").array().notNull().default([]),
  viewsCount: integer("views_count").notNull().default(0),
  freeEpisodesCount: integer("free_episodes_count").notNull().default(3),
  episodesPerAdUnlock: integer("episodes_per_ad_unlock").notNull().default(1),
  interstitialAdFreq: integer("interstitial_ad_freq").notNull().default(3),
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDramaSchema = createInsertSchema(dramasTable).omit({ id: true, createdAt: true, viewsCount: true });
export type InsertDrama = z.infer<typeof insertDramaSchema>;
export type DramaRow = typeof dramasTable.$inferSelect;
