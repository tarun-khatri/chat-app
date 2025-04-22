import express from "express";
import { checkAuth, login, logout, signup, updateProfile, requestOtp, verifyOtp, requestPasswordReset, resetPassword } from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.put("/update-profile", protectRoute, updateProfile);

router.get("/check", protectRoute, checkAuth);

router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);

router.post("/request-password-reset", requestPasswordReset);
router.post("/reset-password", resetPassword);

export default router;
