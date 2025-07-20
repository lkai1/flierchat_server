import { Router } from "express";
import { getUserInfoFromJWTController, deleteUserController } from "../controllers/userControllers.ts";
import { verifyJWTMiddleware } from "../middlewares/authMiddlewares.ts";

const router = Router();

router.get("/user_info", verifyJWTMiddleware, getUserInfoFromJWTController);
router.delete("/", verifyJWTMiddleware, deleteUserController);

export default router;