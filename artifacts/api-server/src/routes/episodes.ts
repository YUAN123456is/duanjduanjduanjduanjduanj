import { Router, type IRouter } from "express";
import { eq, and, sql, inArray } from "drizzle-orm";
import { db, dramasTable, episodesTable, unlockedEpisodesTable, dailyUnlockCountersTable, globalConfigTable } from "@workspace/db";
import {
  CreateEpisodeParams,
  CreateEpisodeBody,
  CreateEpisodeResponse,
  UpdateEpisodeParams,
  UpdateEpisodeBody,
  UpdateEpisodeResponse,
  DeleteEpisodeParams,
  BatchCreateEpisodesParams,
  BatchCreateEpisodesBody,
  BatchCreateEpisodesResponse,
  BatchDeleteEpisodesBody,
  BatchDeleteEpisodesResponse,
  UnlockEpisodesBody,
  UnlockEpisodesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/dramas/:dramaId/episodes/batch", async (req, res): Promise<void> => {
  const params = BatchCreateEpisodesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = BatchCreateEpisodesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [drama] = await db.select().from(dramasTable).where(eq(dramasTable.id, params.data.dramaId));
  if (!drama) {
    res.status(404).json({ error: "Drama not found" });
    return;
  }

  const existing = await db
    .select()
    .from(episodesTable)
    .where(eq(episodesTable.dramaId, params.data.dramaId));
  const existingByNumber = new Map(existing.map((ep) => [ep.episodeNumber, ep]));

  let createdCount = 0;
  let updatedCount = 0;

  for (const row of parsed.data.episodes) {
    const match = existingByNumber.get(row.episodeNumber);
    if (match) {
      await db
        .update(episodesTable)
        .set({
          videoUrl: row.videoUrl,
          ...(row.title !== undefined ? { title: row.title } : {}),
          ...(row.duration !== undefined ? { duration: row.duration } : {}),
        })
        .where(eq(episodesTable.id, match.id));
      updatedCount++;
    } else {
      await db.insert(episodesTable).values({
        dramaId: params.data.dramaId,
        episodeNumber: row.episodeNumber,
        title: row.title,
        videoUrl: row.videoUrl,
        ...(row.duration !== undefined ? { duration: row.duration } : {}),
      });
      createdCount++;
    }
  }

  const episodes = await db
    .select()
    .from(episodesTable)
    .where(eq(episodesTable.dramaId, params.data.dramaId));

  res.json(
    BatchCreateEpisodesResponse.parse({
      episodes,
      createdCount,
      updatedCount,
    }),
  );
});

router.post("/episodes/batch-delete", async (req, res): Promise<void> => {
  const parsed = BatchDeleteEpisodesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (parsed.data.episodeIds.length === 0) {
    res.json(BatchDeleteEpisodesResponse.parse({ deletedCount: 0 }));
    return;
  }

  const deleted = await db
    .delete(episodesTable)
    .where(inArray(episodesTable.id, parsed.data.episodeIds))
    .returning();

  res.json(BatchDeleteEpisodesResponse.parse({ deletedCount: deleted.length }));
});

router.post("/dramas/:dramaId/episodes", async (req, res): Promise<void> => {
  const params = CreateEpisodeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = CreateEpisodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [drama] = await db.select().from(dramasTable).where(eq(dramasTable.id, params.data.dramaId));
  if (!drama) {
    res.status(404).json({ error: "Drama not found" });
    return;
  }

  const [episode] = await db
    .insert(episodesTable)
    .values({ ...parsed.data, dramaId: params.data.dramaId })
    .returning();

  res.status(201).json(CreateEpisodeResponse.parse(episode));
});

router.patch("/episodes/:episodeId", async (req, res): Promise<void> => {
  const params = UpdateEpisodeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateEpisodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(episodesTable)
    .set(parsed.data)
    .where(eq(episodesTable.id, params.data.episodeId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Episode not found" });
    return;
  }

  res.json(UpdateEpisodeResponse.parse(updated));
});

router.delete("/episodes/:episodeId", async (req, res): Promise<void> => {
  const params = DeleteEpisodeParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db.delete(episodesTable).where(eq(episodesTable.id, params.data.episodeId)).returning();

  if (!deleted) {
    res.status(404).json({ error: "Episode not found" });
    return;
  }

  res.sendStatus(204);
});

router.post("/episodes/unlock", async (req, res): Promise<void> => {
  const parsed = UnlockEpisodesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { userId, dramaId, currentEpisodeNumber } = parsed.data;

  const [drama] = await db.select().from(dramasTable).where(eq(dramasTable.id, dramaId));
  if (!drama) {
    res.status(404).json({ error: "Drama not found" });
    return;
  }

  const [config] = await db.select().from(globalConfigTable).where(eq(globalConfigTable.id, 1));
  const maxDailyAdUnlocks = config?.maxDailyAdUnlocks ?? 20;

  const today = new Date().toISOString().slice(0, 10);
  const [counter] = await db
    .select()
    .from(dailyUnlockCountersTable)
    .where(and(eq(dailyUnlockCountersTable.userId, userId), eq(dailyUnlockCountersTable.unlockDate, today)));

  const usedSoFar = counter?.count ?? 0;
  if (usedSoFar >= maxDailyAdUnlocks) {
    res.status(400).json({ error: "Daily unlock limit reached" });
    return;
  }

  const episodesToUnlock: number[] = [];
  for (let i = 0; i < drama.episodesPerAdUnlock; i++) {
    episodesToUnlock.push(currentEpisodeNumber + i);
  }

  for (const episodeNumber of episodesToUnlock) {
    await db
      .insert(unlockedEpisodesTable)
      .values({ userId, dramaId, episodeNumber })
      .onConflictDoNothing();
  }

  if (counter) {
    await db
      .update(dailyUnlockCountersTable)
      .set({ count: usedSoFar + 1 })
      .where(eq(dailyUnlockCountersTable.id, counter.id));
  } else {
    await db.insert(dailyUnlockCountersTable).values({ userId, unlockDate: today, count: 1 });
  }

  res.json(
    UnlockEpisodesResponse.parse({
      unlockedEpisodes: episodesToUnlock,
      dailyUnlocksUsed: usedSoFar + 1,
      dailyUnlocksRemaining: Math.max(0, maxDailyAdUnlocks - (usedSoFar + 1)),
    }),
  );
});

export default router;
