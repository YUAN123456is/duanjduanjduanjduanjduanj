import { Router, type IRouter } from "express";
import healthRouter from "./health";
import configRouter from "./config";
import dramasRouter from "./dramas";
import episodesRouter from "./episodes";
import usersRouter from "./users";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(configRouter);
router.use(dramasRouter);
router.use(episodesRouter);
router.use(usersRouter);
router.use(adminRouter);

export default router;
