import { io, type Socket } from "socket.io-client";
import type {
  ChatMessage,
  EnterSessionResponse,
  ParticipantView,
  PlaybackCommand,
  PlaybackStateView,
  SystemMessage,
} from "../types/Session";

interface ServerToClientEvents {
  "chat:message": (message: ChatMessage) => void;
  "participants:updated": (participants: ParticipantView[]) => void;
  "playback:state": (playback: PlaybackStateView) => void;
  "system:message": (message: SystemMessage) => void;
}

interface ClientToServerEvents {
  "chat:send": (payload: { message: string }) => void;
  "playback:command": (command: PlaybackCommand) => void;
  "session:enter": (
    payload: { sessionId: string; username: string },
    acknowledge: (response: EnterSessionResponse) => void,
  ) => void;
}

export const sessionSocket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
  autoConnect: false,
});
