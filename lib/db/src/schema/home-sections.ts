import { pgTable, text, integer, timestamp, uuid, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { dramasTable } from "./dramas";

export const homeSectionsTable = pgTable("home_sections", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertHomeSectionSchema = createInsertSchema(homeSectionsTable).omit({ id: true, createdAt: true });
export type InsertHomeSection = z.infer<typeof insertHomeSectionSchema>;
export type HomeSectionRow = typeof homeSectionsTable.$inferSelect;

export const dramaHomeSectionsTable = pgTable("drama_home_sections", {
  id: uuid("id").primaryKey().defaultRandom(),
  sectionId: uuid("section_id").notNull().references(() => homeSectionsTable.id, { onDelete: "cascade" }),
  dramaId: uuid("drama_id").notNull().references(() => dramasTable.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
}, (table) => [
  unique().on(table.sectionId, table.dramaId),
]);

export const insertDramaHomeSectionSchema = createInsertSchema(dramaHomeSectionsTable).omit({ id: true });
export type InsertDramaHomeSection = z.infer<typeof insertDramaHomeSectionSchema>;
export type DramaHomeSectionRow = typeof dramaHomeSectionsTable.$inferSelect;
