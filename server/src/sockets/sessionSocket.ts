import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import type { ParticipantView } from "../models/Session.js";
import * as sessionService from "../services/sessionService.js";

interface SystemMessage {
  type: "join" | "leave";
  username: string;
  message: string;
}

type EnterSessionResponse =
  | { ok: true }
  | { ok: false; error: sessionService.AdmissionError };

interface ServerToClientEvents {
  "participants:updated": (participants: ParticipantView[]) => void;
  "system:message": (message: SystemMessage) => void;
}

interface ClientToServerEvents {
  "session:enter": (
    payload: unknown,
    acknowledge: (response: EnterSessionResponse) => void,
  ) => void;
}

interface SocketData {
  sessionId?: string;
}

interface EnterSessionPayload {
  sessionId: string;
  username: string;
}

function isEnterSessionPayload(payload: unknown): payload is EnterSessionPayload {
  if (!payload || typeof payload !== "object") {
    return false;
  }

  const candidate = payload as Record<string, unknown>;
  return (
    typeof candidate.sessionId === "string" &&
    typeof candidate.username === "string"
  );
}

export function configureSessionSocket(httpServer: HttpServer) {
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
  >(httpServer, {
    cors: { origin: "http://localhost:5173" },
  });

  io.on("connection", (socket) => {
    socket.on("session:enter", async (payload, acknowledge) => {
      if (typeof acknowledge !== "function") {
        return;
      }

      if (!isEnterSessionPayload(payload) || socket.data.sessionId) {
        acknowledge({ ok: false, error: "invalid_identity" });
        return;
      }

      const username = payload.username.trim();
      const result = sessionService.admitParticipant(
        payload.sessionId,
        username,
        socket.id,
      );

      if ("error" in result) {
        acknowledge({ ok: false, error: result.error });
        return;
      }

      socket.data.sessionId = result.session.id;
      await socket.join(result.session.id);
      acknowledge({ ok: true });

      io.to(result.session.id).emit("participants:updated", result.participants);
      io.to(result.session.id).emit("system:message", {
        type: "join",
        username,
        message: `${username} joined the party.`,
      });
    });

    socket.on("disconnect", () => {
      const { sessionId } = socket.data;

      if (!sessionId) {
        return;
      }

      const result = sessionService.removeParticipant(sessionId, socket.id);

      if (!result) {
        return;
      }

      io.to(sessionId).emit("participants:updated", result.participants);
      io.to(sessionId).emit("system:message", {
        type: "leave",
        username: result.username,
        message: `${result.username} left the party.`,
      });
    });
  });

  return io;
}
