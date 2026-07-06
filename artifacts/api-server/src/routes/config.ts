import { Router, type IRouter } from "express";
import { db, globalConfigTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GetGlobalConfigResponse, UpdateGlobalConfigBody, UpdateGlobalConfigResponse } from "@workspace/api-zod";

const router: IRouter = Router();

async function getOrCreateConfig() {
  const [existing] = await db.select().from(globalConfigTable).where(eq(globalConfigTable.id, 1));
  if (existing) return existing;
  const [created] = await db.insert(globalConfigTable).values({ id: 1 }).returning();
  return created;
}

router.get("/config/global", async (_req, res): Promise<void> => {
  const config = await getOrCreateConfig();
  res.json(GetGlobalConfigResponse.parse(config));
});

router.patch("/config/global", async (req, res): Promise<void> => {
  const parsed = UpdateGlobalConfigBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  await getOrCreateConfig();

  const [updated] = await db
    .update(globalConfigTable)
    .set(parsed.data)
    .where(eq(globalConfigTable.id, 1))
    .returning();

  res.json(UpdateGlobalConfigResponse.parse(updated));
});

export default router;
