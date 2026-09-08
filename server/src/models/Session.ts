export interface Participant {
  username: string;
  isCreator: boolean;
}

export interface Session {
  id: string;
  joinCode: string;
  name: string;
  videoUrl: string;
  createdAt: number;
  participants: Participant[];
}
