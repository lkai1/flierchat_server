import { Router } from "express"
import { getUserInfoFromJWTController, deleteUserController } from "../controllers/userControllers.js"
import { verifyJWTMiddleware } from "../middlewares/authMiddlewares.js"

const router = Router()

router.get("/user_info", verifyJWTMiddleware, getUserInfoFromJWTController)
router.delete("/", verifyJWTMiddleware, deleteUserController)

export default router