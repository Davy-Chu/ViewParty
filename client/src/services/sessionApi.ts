import type { Session } from "../types/Session";

interface ErrorResponse {
  error?: string;
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ErrorResponse;
    return body.error ?? "Something went wrong. Please try again.";
  } catch {
    return "Something went wrong. Please try again.";
  }
}

export async function createSession(
  username: string,
  name: string,
  videoUrl: string,
): Promise<Session> {
  const response = await fetch("/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, name, videoUrl }),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return (await response.json()) as Session;
}

export async function joinSession(
  username: string,
  joinCode: string,
): Promise<Session> {
  const response = await fetch("/api/sessions/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, joinCode }),
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return (await response.json()) as Session;
}

export async function getSession(
  sessionId: string,
  signal?: AbortSignal,
): Promise<Session> {
  const response = await fetch(`/api/sessions/${encodeURIComponent(sessionId)}`, {
    signal,
  });

  if (!response.ok) {
    throw new Error(await readError(response));
  }

  return (await response.json()) as Session;
}
