import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, favoritesTable, watchProgressTable, dramasTable, usersTable } from "@workspace/db";
import {
  ListFavoritesParams,
  ListFavoritesResponse,
  AddFavoriteParams,
  AddFavoriteResponse,
  RemoveFavoriteParams,
  ListWatchProgressParams,
  ListWatchProgressResponse,
  SetWatchProgressParams,
  SetWatchProgressBody,
  SetWatchProgressResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/users/:userId/favorites", async (req, res): Promise<void> => {
  const params = ListFavoritesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const rows = await db
    .select({
      dramaId: favoritesTable.dramaId,
      createdAt: favoritesTable.createdAt,
      titleEn: dramasTable.titleEn,
      titles: dramasTable.titles,
      coverUrl: dramasTable.coverUrl,
      freeEpisodesCount: dramasTable.freeEpisodesCount,
    })
    .from(favoritesTable)
    .innerJoin(dramasTable, eq(dramasTable.id, favoritesTable.dramaId))
    .where(eq(favoritesTable.userId, params.data.userId))
    .orderBy(desc(favoritesTable.createdAt));

  res.json(ListFavoritesResponse.parse(rows));
});

router.put("/users/:userId/favorites/:dramaId", async (req, res): Promise<void> => {
  const params = AddFavoriteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.userId));
  const [drama] = await db.select().from(dramasTable).where(eq(dramasTable.id, params.data.dramaId));
  if (!user || !drama) {
    res.status(404).json({ error: "User or drama not found" });
    return;
  }

  await db
    .insert(favoritesTable)
    .values({ userId: params.data.userId, dramaId: params.data.dramaId })
    .onConflictDoNothing();

  const [favorite] = await db
    .select({ createdAt: favoritesTable.createdAt })
    .from(favoritesTable)
    .where(and(eq(favoritesTable.userId, params.data.userId), eq(favoritesTable.dramaId, params.data.dramaId)));

  res.json(
    AddFavoriteResponse.parse({
      dramaId: drama.id,
      createdAt: favorite.createdAt,
      titleEn: drama.titleEn,
      titles: drama.titles,
      coverUrl: drama.coverUrl,
      freeEpisodesCount: drama.freeEpisodesCount,
    }),
  );
});

router.delete("/users/:userId/favorites/:dramaId", async (req, res): Promise<void> => {
  const params = RemoveFavoriteParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db
    .delete(favoritesTable)
    .where(and(eq(favoritesTable.userId, params.data.userId), eq(favoritesTable.dramaId, params.data.dramaId)));

  res.sendStatus(204);
});

router.get("/users/:userId/watch-progress", async (req, res): Promise<void> => {
  const params = ListWatchProgressParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const rows = await db
    .select({
      dramaId: watchProgressTable.dramaId,
      lastEpisode: watchProgressTable.lastEpisode,
      position: watchProgressTable.position,
      updatedAt: watchProgressTable.updatedAt,
    })
    .from(watchProgressTable)
    .where(eq(watchProgressTable.userId, params.data.userId))
    .orderBy(desc(watchProgressTable.updatedAt));

  res.json(ListWatchProgressResponse.parse(rows));
});

router.put("/users/:userId/watch-progress/:dramaId", async (req, res): Promise<void> => {
  const params = SetWatchProgressParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = SetWatchProgressBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, params.data.userId));
  const [drama] = await db.select().from(dramasTable).where(eq(dramasTable.id, params.data.dramaId));
  if (!user || !drama) {
    res.status(404).json({ error: "User or drama not found" });
    return;
  }

  await db
    .insert(watchProgressTable)
    .values({
      userId: params.data.userId,
      dramaId: params.data.dramaId,
      lastEpisode: parsed.data.lastEpisode,
      position: parsed.data.position,
    })
    .onConflictDoUpdate({
      target: [watchProgressTable.userId, watchProgressTable.dramaId],
      set: { lastEpisode: parsed.data.lastEpisode, position: parsed.data.position, updatedAt: new Date() },
    });

  const [progress] = await db
    .select()
    .from(watchProgressTable)
    .where(and(eq(watchProgressTable.userId, params.data.userId), eq(watchProgressTable.dramaId, params.data.dramaId)));

  res.json(SetWatchProgressResponse.parse(progress));
});

export default router;
