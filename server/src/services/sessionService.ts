import { randomUUID } from "node:crypto";
import type { Session } from "../models/Session.js";

const sessions = new Map<string, Session>();

export function createSession(name: string, videoUrl: string): Session {
  const session: Session = {
    id: randomUUID(),
    name,
    videoUrl,
    createdAt: Date.now(),
  };

  sessions.set(session.id, session);
  return session;
}

export function getSession(sessionId: string): Session | undefined {
  return sessions.get(sessionId);
}

