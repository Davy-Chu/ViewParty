import { io, type Socket } from "socket.io-client";
import type {
  ChatMessage,
  EnterSessionResponse,
  ParticipantView,
  SystemMessage,
} from "../types/Session";

interface ServerToClientEvents {
  "chat:message": (message: ChatMessage) => void;
  "participants:updated": (participants: ParticipantView[]) => void;
  "system:message": (message: SystemMessage) => void;
}

interface ClientToServerEvents {
  "chat:send": (payload: { message: string }) => void;
  "session:enter": (
    payload: { sessionId: string; username: string },
    acknowledge: (response: EnterSessionResponse) => void,
  ) => void;
}

export const sessionSocket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
  autoConnect: false,
});
