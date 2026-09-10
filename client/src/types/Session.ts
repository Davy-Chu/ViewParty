export const MAX_PARTICIPANTS = 5;
export const MAX_CHAT_MESSAGE_LENGTH = 500;

export interface ParticipantView {
  username: string;
  isHost: boolean;
}

export interface Session {
  id: string;
  joinCode: string;
  name: string;
  videoUrl: string;
  createdAt: number;
}

export interface SystemMessage {
  type: "join" | "leave";
  username: string;
  message: string;
}

export interface ChatMessage {
  username: string;
  message: string;
}

export type RoomMessage =
  | {
      type: "chat";
      username: string;
      message: string;
    }
  | {
      type: "system";
      message: string;
    };

export type AdmissionError =
  | "session_not_found"
  | "party_full"
  | "username_taken"
  | "invalid_identity";

export type EnterSessionResponse =
  | { ok: true }
  | { ok: false; error: AdmissionError };
