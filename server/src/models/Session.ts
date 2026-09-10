export interface Participant {
  username: string;
  socketId: string;
}

export interface Session {
  id: string;
  joinCode: string;
  name: string;
  videoUrl: string;
  createdAt: number;
  creatorUsername: string;
  hostUsername: string | null;
  participants: Participant[];
  playback: PlaybackState;
}

export interface PlaybackState {
  isPlaying: boolean;
  position: number;
  updatedAt: number;
}

export interface PlaybackStateView {
  isPlaying: boolean;
  position: number;
}

export interface SessionMetadata {
  id: string;
  joinCode: string;
  name: string;
  videoUrl: string;
  createdAt: number;
}

export interface ParticipantView {
  username: string;
  isHost: boolean;
}

export interface ChatMessage {
  username: string;
  message: string;
}
