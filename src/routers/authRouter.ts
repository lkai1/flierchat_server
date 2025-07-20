import { Router } from "express";
import { registerController, loginController, verifyLoginController, logoutController } from "../controllers/authControllers";

const router = Router();

router.post("/register", registerController);
router.post("/login", loginController);
router.get("/verify_login", verifyLoginController);
router.post("/logout", logoutController);

export default router;