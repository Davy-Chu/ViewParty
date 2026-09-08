# ViewParty

ViewParty is a real-time synchronized media application built as a learning project. Its future milestones will explore real-time communication, concurrency, synchronization, reliability, and distributed systems.

## Current milestone

**Milestone 2: joinable sessions and participant tracking.**

The application supports temporary watch parties stored in server memory. A creator chooses a username, party name, and YouTube URL. Up to four more participants can join using a unique five-character party code. The watch page displays the code, member list, and locally controlled YouTube player.

Available pages:

- `/` — choose to create or join a party
- `/create` — create a party
- `/join` — join with a username and party code
- `/watch/:sessionId` — view a party using its internal UUID

Party membership lasts until the backend restarts. Playback synchronization and live participant updates are intentionally not implemented yet.

## Run the project

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

The development servers are available at:

- Frontend: <http://localhost:5173>
- Create page: <http://localhost:5173/create>
- Join page: <http://localhost:5173/join>
- Backend: <http://localhost:3001>
- Health check: <http://localhost:3001/api/health>

To run an application independently, use `npm run dev --workspace client` or `npm run dev --workspace server`.

Use `npm run build` to build both applications and `npm run typecheck` to check their TypeScript code.

