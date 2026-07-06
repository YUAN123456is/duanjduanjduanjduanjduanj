import { Router, type IRouter } from "express";
import { eq, sql, and, ilike, or } from "drizzle-orm";
import { db, dramasTable, episodesTable, unlockedEpisodesTable } from "@workspace/db";
import {
  ListDramasQueryParams,
  ListDramasResponse,
  CreateDramaBody,
  CreateDramaResponse,
  GetDramaParams,
  GetDramaResponse,
  UpdateDramaParams,
  UpdateDramaBody,
  UpdateDramaResponse,
  DeleteDramaParams,
  GetDramaPlaybackQueryParams,
  GetDramaPlaybackResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/dramas", async (req, res): Promise<void> => {
  const query = ListDramasQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const rows = await db
    .select({
      id: dramasTable.id,
      titleEn: dramasTable.titleEn,
      titleEs: dramasTable.titleEs,
      titleZhTw: dramasTable.titleZhTw,
      coverUrl: dramasTable.coverUrl,
      description: dramasTable.description,
      tags: dramasTable.tags,
      viewsCount: dramasTable.viewsCount,
      freeEpisodesCount: dramasTable.freeEpisodesCount,
      episodesPerAdUnlock: dramasTable.episodesPerAdUnlock,
      interstitialAdFreq: dramasTable.interstitialAdFreq,
      isPublished: dramasTable.isPublished,
      createdAt: dramasTable.createdAt,
      totalEpisodes: sql<number>`count(${episodesTable.id})::int`,
    })
    .from(dramasTable)
    .leftJoin(episodesTable, eq(episodesTable.dramaId, dramasTable.id))
    .where(
      and(
        query.data.publishedOnly ? eq(dramasTable.isPublished, true) : undefined,
        query.data.search
          ? or(
              ilike(dramasTable.titleEn, `%${query.data.search}%`),
              ilike(dramasTable.titleEs, `%${query.data.search}%`),
              ilike(dramasTable.titleZhTw, `%${query.data.search}%`),
            )
          : undefined,
      ),
    )
    .groupBy(dramasTable.id)
    .orderBy(dramasTable.createdAt);

  res.json(ListDramasResponse.parse(rows));
});

router.post("/dramas", async (req, res): Promise<void> => {
  const parsed = CreateDramaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [drama] = await db.insert(dramasTable).values(parsed.data).returning();

  res.status(201).json(CreateDramaResponse.parse({ ...drama, totalEpisodes: 0 }));
});

router.get("/dramas/playback", async (req, res): Promise<void> => {
  const query = GetDramaPlaybackQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const [drama] = await db.select().from(dramasTable).where(eq(dramasTable.id, query.data.dramaId));
  if (!drama) {
    res.status(404).json({ error: "Drama not found" });
    return;
  }

  const episodes = await db
    .select()
    .from(episodesTable)
    .where(eq(episodesTable.dramaId, query.data.dramaId))
    .orderBy(episodesTable.episodeNumber);

  let unlockedNumbers = new Set<number>();
  if (query.data.userId) {
    const unlocks = await db
      .select({ episodeNumber: unlockedEpisodesTable.episodeNumber })
      .from(unlockedEpisodesTable)
      .where(
        sql`${unlockedEpisodesTable.userId} = ${query.data.userId} and ${unlockedEpisodesTable.dramaId} = ${query.data.dramaId}`,
      );
    unlockedNumbers = new Set(unlocks.map((u) => u.episodeNumber));
  }

  const playbackEpisodes = episodes.map((ep) => ({
    episodeNumber: ep.episodeNumber,
    title: ep.title,
    videoUrl: ep.videoUrl,
    isUnlocked: ep.episodeNumber <= drama.freeEpisodesCount || unlockedNumbers.has(ep.episodeNumber),
  }));

  await db
    .update(dramasTable)
    .set({ viewsCount: sql`${dramasTable.viewsCount} + 1` })
    .where(eq(dramasTable.id, query.data.dramaId));

  res.json(
    GetDramaPlaybackResponse.parse({
      dramaId: drama.id,
      title: drama.titleEn,
      coverUrl: drama.coverUrl,
      description: drama.description,
      tags: drama.tags,
      monetizationRules: {
        freeEpisodesCount: drama.freeEpisodesCount,
        episodesPerAdUnlock: drama.episodesPerAdUnlock,
        interstitialAdFreq: drama.interstitialAdFreq,
      },
      episodes: playbackEpisodes,
    }),
  );
});

router.get("/dramas/:dramaId", async (req, res): Promise<void> => {
  const params = GetDramaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [drama] = await db.select().from(dramasTable).where(eq(dramasTable.id, params.data.dramaId));
  if (!drama) {
    res.status(404).json({ error: "Drama not found" });
    return;
  }

  const episodes = await db
    .select()
    .from(episodesTable)
    .where(eq(episodesTable.dramaId, params.data.dramaId))
    .orderBy(episodesTable.episodeNumber);

  res.json(GetDramaResponse.parse({ ...drama, totalEpisodes: episodes.length, episodes }));
});

router.patch("/dramas/:dramaId", async (req, res): Promise<void> => {
  const params = UpdateDramaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateDramaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db
    .update(dramasTable)
    .set(parsed.data)
    .where(eq(dramasTable.id, params.data.dramaId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Drama not found" });
    return;
  }

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(episodesTable)
    .where(eq(episodesTable.dramaId, params.data.dramaId));

  res.json(UpdateDramaResponse.parse({ ...updated, totalEpisodes: count }));
});

router.delete("/dramas/:dramaId", async (req, res): Promise<void> => {
  const params = DeleteDramaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db.delete(dramasTable).where(eq(dramasTable.id, params.data.dramaId)).returning();

  if (!deleted) {
    res.status(404).json({ error: "Drama not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
