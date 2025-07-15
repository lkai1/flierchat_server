import { Router } from "express"
import { createMessageController, getChatMessagesController, deleteAllUserMessagesFromChatController, deleteUserMessageController } from "../controllers/messageControllers.js"
import { verifyJWTMiddleware } from "../middlewares/authMiddlewares.js"

const router = Router()

router.post("/", verifyJWTMiddleware, createMessageController)
router.get("/", verifyJWTMiddleware, getChatMessagesController)
router.delete("/all_from_user", verifyJWTMiddleware, deleteAllUserMessagesFromChatController)
router.delete("/", verifyJWTMiddleware, deleteUserMessageController)

export default router