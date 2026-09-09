export const MAX_PARTICIPANTS = 5;

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

export type AdmissionError =
  | "session_not_found"
  | "party_full"
  | "username_taken"
  | "invalid_identity";

export type EnterSessionResponse =
  | { ok: true }
  | { ok: false; error: AdmissionError };
