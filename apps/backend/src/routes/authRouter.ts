import { Router } from "express";
import { getMe, logout, signin, signup } from "../controllers/authControllers.js";

const authRouter: Router = Router();

authRouter.post("/signup", signup);
authRouter.post("/signin", signin);
authRouter.get("/me", getMe);
authRouter.post("/logout", logout);

export default authRouter;