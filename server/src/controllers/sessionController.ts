import type { Request, Response } from "express";
import * as sessionService from "../services/sessionService.js";

export function createSession(request: Request, response: Response) {
  const { username, name, videoUrl } = request.body as {
    username?: unknown;
    name?: unknown;
    videoUrl?: unknown;
  };

  if (
    typeof username !== "string" ||
    username.trim() === "" ||
    typeof name !== "string" ||
    name.trim() === "" ||
    typeof videoUrl !== "string" ||
    videoUrl.trim() === ""
  ) {
    response.status(400).json({
      error: "Username, session name, and video URL are required.",
    });
    return;
  }

  const session = sessionService.createSession(
    username.trim(),
    name.trim(),
    videoUrl.trim(),
  );
  response.status(201).json(sessionService.toSessionMetadata(session));
}

export function joinSession(request: Request, response: Response) {
  const { username, joinCode } = request.body as {
    username?: unknown;
    joinCode?: unknown;
  };

  if (
    typeof username !== "string" ||
    username.trim() === "" ||
    typeof joinCode !== "string" ||
    joinCode.trim() === ""
  ) {
    response.status(400).json({ error: "Username and party code are required." });
    return;
  }

  const result = sessionService.validateJoin(username.trim(), joinCode.trim());

  if ("error" in result) {
    const errors = {
      not_found: { status: 404, message: "Party not found." },
      full: { status: 409, message: "Party is full." },
      username_taken: { status: 409, message: "Username is already taken." },
    } as const;
    const error = errors[result.error];
    response.status(error.status).json({ error: error.message });
    return;
  }

  response.status(200).json(sessionService.toSessionMetadata(result.session));
}

export function getSession(request: Request, response: Response) {
  const { sessionId } = request.params;
  const session =
    typeof sessionId === "string" ? sessionService.getSession(sessionId) : undefined;

  if (!session) {
    response.status(404).json({ error: "Session not found." });
    return;
  }

  response.status(200).json(sessionService.toSessionMetadata(session));
}

