import { Router } from "express";
import { createMessageController, getChatMessagesController, deleteAllUserMessagesFromChatController, deleteUserMessageController } from "../controllers/messageControllers.ts";
import { verifyJWTMiddleware } from "../middlewares/authMiddlewares.ts";

const router = Router();

router.post("/", verifyJWTMiddleware, createMessageController);
router.get("/", verifyJWTMiddleware, getChatMessagesController);
router.delete("/all_from_user", verifyJWTMiddleware, deleteAllUserMessagesFromChatController);
router.delete("/", verifyJWTMiddleware, deleteUserMessageController);

export default router;