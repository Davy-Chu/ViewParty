import { Router } from "express";
import { createSession, getSession } from "../controllers/sessionController.js";

const sessionRoutes = Router();

sessionRoutes.post("/", createSession);
sessionRoutes.get("/:sessionId", getSession);

export default sessionRoutes;

