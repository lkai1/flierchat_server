import { Router } from "express"
import { verifyJWTMiddleware } from "../middlewares/authMiddlewares.js"
import {
    createPrivateChatController,
    createGroupChatController,
    getUserChatsController,
    addGroupChatParticipantController,
    deleteChatController,
    removeChatParticipantController,
    getUnreadMessagesInChatController,
    updateUnreadMessagesInChatController
} from "../controllers/chatControllers.js"

const router = Router()

router.post("/private", verifyJWTMiddleware, createPrivateChatController)
router.post("/group", verifyJWTMiddleware, createGroupChatController)
router.post("/group/participant", verifyJWTMiddleware, addGroupChatParticipantController)
router.delete("/participant", verifyJWTMiddleware, removeChatParticipantController)
router.get("/", verifyJWTMiddleware, getUserChatsController)
router.delete("/", verifyJWTMiddleware, deleteChatController)
router.get("/unread_messages", verifyJWTMiddleware, getUnreadMessagesInChatController)
router.patch("/unread_messages", verifyJWTMiddleware, updateUnreadMessagesInChatController)

export default router