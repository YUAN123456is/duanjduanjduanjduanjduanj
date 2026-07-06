import { Router, type IRouter } from "express";
import { eq, inArray, asc, sql } from "drizzle-orm";
import { db, homeSectionsTable, dramaHomeSectionsTable, dramasTable, episodesTable } from "@workspace/db";
import {
  ListHomeSectionsResponse,
  CreateHomeSectionBody,
  CreateHomeSectionResponse,
  UpdateHomeSectionParams,
  UpdateHomeSectionBody,
  UpdateHomeSectionResponse,
  DeleteHomeSectionParams,
  SetHomeSectionDramasParams,
  SetHomeSectionDramasBody,
  SetHomeSectionDramasResponse,
  GetHomeFeedResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

async function loadSectionWithDramas(sectionId: string) {
  const [section] = await db.select().from(homeSectionsTable).where(eq(homeSectionsTable.id, sectionId));
  if (!section) return null;

  const assignments = await db
    .select({
      dramaId: dramaHomeSectionsTable.dramaId,
      sortOrder: dramaHomeSectionsTable.sortOrder,
      titleEn: dramasTable.titleEn,
      coverUrl: dramasTable.coverUrl,
    })
    .from(dramaHomeSectionsTable)
    .innerJoin(dramasTable, eq(dramasTable.id, dramaHomeSectionsTable.dramaId))
    .where(eq(dramaHomeSectionsTable.sectionId, sectionId))
    .orderBy(asc(dramaHomeSectionsTable.sortOrder));

  return { ...section, dramas: assignments };
}

router.get("/home-sections", async (_req, res): Promise<void> => {
  const sections = await db.select().from(homeSectionsTable).orderBy(asc(homeSectionsTable.sortOrder));

  const result = await Promise.all(sections.map((section) => loadSectionWithDramas(section.id)));

  res.json(ListHomeSectionsResponse.parse(result.filter(Boolean)));
});

router.post("/home-sections", async (req, res): Promise<void> => {
  const parsed = CreateHomeSectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [section] = await db.insert(homeSectionsTable).values(parsed.data).returning();

  res.status(201).json(CreateHomeSectionResponse.parse({ ...section, dramas: [] }));
});

router.patch("/home-sections/:sectionId", async (req, res): Promise<void> => {
  const params = UpdateHomeSectionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateHomeSectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(homeSectionsTable)
    .set(parsed.data)
    .where(eq(homeSectionsTable.id, params.data.sectionId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Section not found" });
    return;
  }

  const withDramas = await loadSectionWithDramas(updated.id);
  res.json(UpdateHomeSectionResponse.parse(withDramas));
});

router.delete("/home-sections/:sectionId", async (req, res): Promise<void> => {
  const params = DeleteHomeSectionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(homeSectionsTable)
    .where(eq(homeSectionsTable.id, params.data.sectionId))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Section not found" });
    return;
  }

  res.sendStatus(204);
});

router.put("/home-sections/:sectionId/dramas", async (req, res): Promise<void> => {
  const params = SetHomeSectionDramasParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = SetHomeSectionDramasBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [section] = await db.select().from(homeSectionsTable).where(eq(homeSectionsTable.id, params.data.sectionId));
  if (!section) {
    res.status(404).json({ error: "Section not found" });
    return;
  }

  await db.delete(dramaHomeSectionsTable).where(eq(dramaHomeSectionsTable.sectionId, params.data.sectionId));

  if (parsed.data.dramas.length > 0) {
    await db.insert(dramaHomeSectionsTable).values(
      parsed.data.dramas.map((d) => ({
        sectionId: params.data.sectionId,
        dramaId: d.dramaId,
        sortOrder: d.sortOrder,
      })),
    );
  }

  const withDramas = await loadSectionWithDramas(params.data.sectionId);
  res.json(SetHomeSectionDramasResponse.parse(withDramas));
});

router.get("/home-feed", async (_req, res): Promise<void> => {
  const sections = await db.select().from(homeSectionsTable).orderBy(asc(homeSectionsTable.sortOrder));

  if (sections.length === 0) {
    res.json(GetHomeFeedResponse.parse([]));
    return;
  }

  const sectionIds = sections.map((s) => s.id);
  const assignments = await db
    .select({
      sectionId: dramaHomeSectionsTable.sectionId,
      sortOrder: dramaHomeSectionsTable.sortOrder,
      drama: dramasTable,
      totalEpisodes: sql<number>`count(${episodesTable.id})::int`,
    })
    .from(dramaHomeSectionsTable)
    .innerJoin(dramasTable, eq(dramasTable.id, dramaHomeSectionsTable.dramaId))
    .leftJoin(episodesTable, eq(episodesTable.dramaId, dramasTable.id))
    .where(inArray(dramaHomeSectionsTable.sectionId, sectionIds))
    .groupBy(dramaHomeSectionsTable.sectionId, dramaHomeSectionsTable.sortOrder, dramasTable.id)
    .orderBy(asc(dramaHomeSectionsTable.sortOrder));

  const dramasBySection = new Map<string, (typeof dramasTable.$inferSelect & { totalEpisodes: number })[]>();
  for (const row of assignments) {
    if (!row.drama.isPublished) continue;
    const list = dramasBySection.get(row.sectionId) ?? [];
    list.push({ ...row.drama, totalEpisodes: row.totalEpisodes });
    dramasBySection.set(row.sectionId, list);
  }

  const feed = sections
    .map((section) => ({
      id: section.id,
      name: section.name,
      sortOrder: section.sortOrder,
      dramas: dramasBySection.get(section.id) ?? [],
    }))
    .filter((section) => section.dramas.length > 0);

  res.json(GetHomeFeedResponse.parse(feed));
});

export default router;
