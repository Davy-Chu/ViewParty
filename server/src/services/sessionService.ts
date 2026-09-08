import { randomInt, randomUUID } from "node:crypto";
import type { Session } from "../models/Session.js";

export const MAX_PARTICIPANTS = 5;

const JOIN_CODE_LENGTH = 5;
const JOIN_CODE_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const sessions = new Map<string, Session>();

export type JoinSessionResult =
  | { session: Session }
  | { error: "not_found" | "full" | "username_taken" };

function createJoinCode(): string {
  let joinCode: string;

  do {
    joinCode = Array.from(
      { length: JOIN_CODE_LENGTH },
      () => JOIN_CODE_CHARACTERS[randomInt(JOIN_CODE_CHARACTERS.length)],
    ).join("");
  } while ([...sessions.values()].some((session) => session.joinCode === joinCode));

  return joinCode;
}

export function createSession(
  username: string,
  name: string,
  videoUrl: string,
): Session {
  const session: Session = {
    id: randomUUID(),
    joinCode: createJoinCode(),
    name,
    videoUrl,
    createdAt: Date.now(),
    participants: [{ username, isCreator: true }],
  };

  sessions.set(session.id, session);
  return session;
}

export function getSession(sessionId: string): Session | undefined {
  return sessions.get(sessionId);
}

export function joinSession(username: string, joinCode: string): JoinSessionResult {
  const normalizedCode = joinCode.toUpperCase();
  const session = [...sessions.values()].find(
    (candidate) => candidate.joinCode === normalizedCode,
  );

  if (!session) {
    return { error: "not_found" };
  }

  if (session.participants.length >= MAX_PARTICIPANTS) {
    return { error: "full" };
  }

  const normalizedUsername = username.toLowerCase();
  const usernameTaken = session.participants.some(
    (participant) => participant.username.toLowerCase() === normalizedUsername,
  );

  if (usernameTaken) {
    return { error: "username_taken" };
  }

  session.participants.push({ username, isCreator: false });
  return { session };
}

