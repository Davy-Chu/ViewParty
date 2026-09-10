import { randomInt, randomUUID } from "node:crypto";
import type {
  ChatMessage,
  ParticipantView,
  Session,
  SessionMetadata,
} from "../models/Session.js";

export const MAX_PARTICIPANTS = 5;
export const MAX_CHAT_MESSAGE_LENGTH = 500;

const JOIN_CODE_LENGTH = 5;
const JOIN_CODE_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const sessions = new Map<string, Session>();

export type AdmissionError =
  | "session_not_found"
  | "party_full"
  | "username_taken"
  | "invalid_identity";

export type SessionLookupResult =
  | { session: Session }
  | { error: "not_found" | "full" | "username_taken" };

export type AdmissionResult =
  | { session: Session; participants: ParticipantView[] }
  | { error: AdmissionError };

export interface RemovalResult {
  session: Session;
  username: string;
  participants: ParticipantView[];
}

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

function findSessionByJoinCode(joinCode: string): Session | undefined {
  const normalizedCode = joinCode.toUpperCase();
  return [...sessions.values()].find(
    (session) => session.joinCode === normalizedCode,
  );
}

function hasUsername(session: Session, username: string): boolean {
  const normalizedUsername = username.toLowerCase();
  return session.participants.some(
    (participant) => participant.username.toLowerCase() === normalizedUsername,
  );
}

export function toSessionMetadata(session: Session): SessionMetadata {
  return {
    id: session.id,
    joinCode: session.joinCode,
    name: session.name,
    videoUrl: session.videoUrl,
    createdAt: session.createdAt,
  };
}

export function getParticipantViews(session: Session): ParticipantView[] {
  return session.participants.map((participant) => ({
    username: participant.username,
    isHost: participant.username === session.hostUsername,
  }));
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
    creatorUsername: username,
    hostUsername: username,
    participants: [],
  };

  sessions.set(session.id, session);
  return session;
}

export function getSession(sessionId: string): Session | undefined {
  return sessions.get(sessionId);
}

export function validateJoin(
  username: string,
  joinCode: string,
): SessionLookupResult {
  const session = findSessionByJoinCode(joinCode);

  if (!session) {
    return { error: "not_found" };
  }

  if (session.participants.length >= MAX_PARTICIPANTS) {
    return { error: "full" };
  }

  if (hasUsername(session, username)) {
    return { error: "username_taken" };
  }

  return { session };
}

export function admitParticipant(
  sessionId: string,
  username: string,
  socketId: string,
): AdmissionResult {
  const trimmedUsername = username.trim();

  if (!sessionId.trim() || !trimmedUsername || !socketId) {
    return { error: "invalid_identity" };
  }

  const session = sessions.get(sessionId);

  if (!session) {
    return { error: "session_not_found" };
  }

  if (session.participants.length >= MAX_PARTICIPANTS) {
    return { error: "party_full" };
  }

  if (hasUsername(session, trimmedUsername)) {
    return { error: "username_taken" };
  }

  session.participants.push({ username: trimmedUsername, socketId });

  if (session.hostUsername === null) {
    session.hostUsername = trimmedUsername;
  }

  return { session, participants: getParticipantViews(session) };
}

export function removeParticipant(
  sessionId: string,
  socketId: string,
): RemovalResult | undefined {
  const session = sessions.get(sessionId);

  if (!session) {
    return undefined;
  }

  const participantIndex = session.participants.findIndex(
    (participant) => participant.socketId === socketId,
  );

  if (participantIndex === -1) {
    return undefined;
  }

  const [participant] = session.participants.splice(participantIndex, 1);

  if (participant.username === session.hostUsername) {
    session.hostUsername = session.participants[0]?.username ?? null;
  }

  return {
    session,
    username: participant.username,
    participants: getParticipantViews(session),
  };
}

export function createChatMessage(
  sessionId: string,
  socketId: string,
  message: unknown,
): ChatMessage | undefined {
  if (typeof message !== "string") {
    return undefined;
  }

  const trimmedMessage = message.trim();

  if (
    trimmedMessage.length === 0 ||
    trimmedMessage.length > MAX_CHAT_MESSAGE_LENGTH
  ) {
    return undefined;
  }

  const session = sessions.get(sessionId);
  const participant = session?.participants.find(
    (candidate) => candidate.socketId === socketId,
  );

  if (!participant) {
    return undefined;
  }

  return {
    username: participant.username,
    message: trimmedMessage,
  };
}
