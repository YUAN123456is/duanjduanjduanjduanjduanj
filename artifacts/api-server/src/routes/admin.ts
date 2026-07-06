import { Router, type IRouter } from "express";
import { sql, eq } from "drizzle-orm";
import { db, dramasTable, episodesTable, unlockedEpisodesTable, dailyUnlockCountersTable } from "@workspace/db";
import { GetDashboardSummaryResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/admin/dashboard-summary", async (_req, res): Promise<void> => {
  const [{ totalDramas }] = await db.select({ totalDramas: sql<number>`count(*)::int` }).from(dramasTable);
  const [{ totalEpisodes }] = await db.select({ totalEpisodes: sql<number>`count(*)::int` }).from(episodesTable);
  const [{ totalViews }] = await db
    .select({ totalViews: sql<number>`coalesce(sum(${dramasTable.viewsCount}), 0)::int` })
    .from(dramasTable);

  const today = new Date().toISOString().slice(0, 10);
  const [{ adUnlocksToday }] = await db
    .select({ adUnlocksToday: sql<number>`coalesce(sum(${dailyUnlockCountersTable.count}), 0)::int` })
    .from(dailyUnlockCountersTable)
    .where(eq(dailyUnlockCountersTable.unlockDate, today));

  res.json(GetDashboardSummaryResponse.parse({ totalDramas, totalEpisodes, totalViews, adUnlocksToday }));
});

export default router;
