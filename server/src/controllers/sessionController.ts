import type { Request, Response } from "express";
import * as sessionService from "../services/sessionService.js";

export function createSession(request: Request, response: Response) {
  const { name, videoUrl } = request.body as {
    name?: unknown;
    videoUrl?: unknown;
  };

  if (
    typeof name !== "string" ||
    name.trim() === "" ||
    typeof videoUrl !== "string" ||
    videoUrl.trim() === ""
  ) {
    response.status(400).json({
      error: "Session name and video URL are required.",
    });
    return;
  }

  const session = sessionService.createSession(name.trim(), videoUrl.trim());
  response.status(201).json(session);
}

export function getSession(request: Request, response: Response) {
  const { sessionId } = request.params;
  const session =
    typeof sessionId === "string" ? sessionService.getSession(sessionId) : undefined;

  if (!session) {
    response.status(404).json({ error: "Session not found." });
    return;
  }

  response.status(200).json(session);
}

