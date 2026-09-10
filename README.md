# ViewParty

ViewParty is a real-time synchronized media application built as a learning project. Its future milestones will explore real-time communication, concurrency, synchronization, reliability, and distributed systems.

## Current milestone

**Milestone 5: synchronized play, pause, and late-join playback.**

The application supports temporary watch parties stored in server memory. A creator chooses a username, party name, and YouTube URL. Up to four more participants can join using a unique five-character party code. Socket.IO keeps the active member list and host status current, delivers ephemeral room chat, and synchronizes play and pause actions. A participant joining an in-progress party receives the current server-derived playback position.

Available pages:

- `/` — choose to create or join a party
- `/create` — create a party
- `/join` — join with a username and party code
- `/watch/:sessionId` — view a party using its internal UUID

Usernames are stored in tab-scoped `sessionStorage`. HTTP joining is preflight validation; Socket.IO admission authoritatively enforces active username uniqueness and the five-person capacity. Chat messages are validated by the server, limited to 500 characters, and never stored or replayed. Playback commands are validated and ordered by the server, with the last processed play or pause command becoming authoritative. Manual seek synchronization and drift correction are deferred.

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

