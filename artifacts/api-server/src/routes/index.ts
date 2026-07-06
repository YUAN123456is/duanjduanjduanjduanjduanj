import { Router, type IRouter } from "express";
import healthRouter from "./health";
import geoRouter from "./geo";
import configRouter from "./config";
import dramasRouter from "./dramas";
import episodesRouter from "./episodes";
import usersRouter from "./users";
import adminRouter from "./admin";
import homeSectionsRouter from "./home-sections";
import favoritesRouter from "./favorites";

const router: IRouter = Router();

router.use(healthRouter);
router.use(geoRouter);
router.use(configRouter);
router.use(dramasRouter);
router.use(episodesRouter);
router.use(usersRouter);
router.use(adminRouter);
router.use(homeSectionsRouter);
router.use(favoritesRouter);

export default router;
