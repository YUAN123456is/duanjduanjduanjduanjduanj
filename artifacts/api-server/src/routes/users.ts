import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { RegisterUserBody, RegisterUserResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/users/register", async (req, res): Promise<void> => {
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.deviceId, parsed.data.deviceId));
  if (existing) {
    res.json(RegisterUserResponse.parse(existing));
    return;
  }

  const [created] = await db.insert(usersTable).values(parsed.data).returning();

  res.json(RegisterUserResponse.parse(created));
});

export default router;
