import { pgTable, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const globalConfigTable = pgTable("global_config", {
  id: integer("id").primaryKey().default(1),
  globalAdEnabled: boolean("global_ad_enabled").notNull().default(true),
  activeAdNetwork: text("active_ad_network").notNull().default("admob"),
  maxDailyAdUnlocks: integer("max_daily_ad_unlocks").notNull().default(20),
  iosRewardUnitId: text("ios_reward_unit_id"),
  androidRewardUnitId: text("android_reward_unit_id"),
  reviewModeActive: boolean("review_mode_active").notNull().default(false),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertGlobalConfigSchema = createInsertSchema(globalConfigTable).omit({ id: true, updatedAt: true });
export type InsertGlobalConfig = z.infer<typeof insertGlobalConfigSchema>;
export type GlobalConfigRow = typeof globalConfigTable.$inferSelect;
