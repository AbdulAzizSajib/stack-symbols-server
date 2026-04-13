import { Router } from "express";
import { authController } from "./auth.controller";
import { checkAuth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";

const authRouter: Router = Router();

authRouter.post("/register", authController.registerUser);
authRouter.post("/login", authController.loginUser);

authRouter.get(
  "/me",
  checkAuth(Role.ADMIN, Role.OWNER),
  authController.getMe,
);
authRouter.post("/refresh-token", authController.getNewToken);
authRouter.post(
  "/change-password",
  checkAuth(Role.ADMIN, Role.OWNER),
  authController.changePassword,
);
authRouter.post(
  "/logout",
  checkAuth(Role.ADMIN, Role.OWNER),
  authController.logoutUser,
);

authRouter.post("/verify-email", authController.verifyEmail);
authRouter.post("/resend-otp", authController.resendOTP);

authRouter.post("/forget-password", authController.forgetPassword);
authRouter.post("/reset-password", authController.resetPassword);

authRouter.get("/login/google", authController.googleLogin);
authRouter.get("/google/success", authController.googleLoginSuccess);
authRouter.get("/oauth/error", authController.handleOAuthError);

export default authRouter;
