import { Router } from "express";
import {
  createSession,
  getSession,
  joinSession,
} from "../controllers/sessionController.js";

const sessionRoutes = Router();

sessionRoutes.post("/", createSession);
sessionRoutes.post("/join", joinSession);
sessionRoutes.get("/:sessionId", getSession);

export default sessionRoutes;

