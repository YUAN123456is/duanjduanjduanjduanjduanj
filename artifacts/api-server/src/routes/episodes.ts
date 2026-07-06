import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, dramasTable, episodesTable, unlockedEpisodesTable, dailyUnlockCountersTable, globalConfigTable } from "@workspace/db";
import {
  CreateEpisodeParams,
  CreateEpisodeBody,
  CreateEpisodeResponse,
  UpdateEpisodeParams,
  UpdateEpisodeBody,
  UpdateEpisodeResponse,
  DeleteEpisodeParams,
  UnlockEpisodesBody,
  UnlockEpisodesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

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
