# ViewParty

ViewParty is a real-time synchronized media application built as a learning project. Its future milestones will explore real-time communication, concurrency, synchronization, reliability, and distributed systems.

## Current milestone

**Milestone 0: project skeleton only.**

The repository currently provides a React frontend, an Express backend, basic routing, and placeholder API endpoints. No session-management or playback-synchronization functionality exists yet.

## Run the project

Requirements: Node.js 20 or newer and npm.

```bash
npm install
npm run dev
```

The development servers are available at:

- Frontend: <http://localhost:5173>
- Create page: <http://localhost:5173/create>
- Example watch page: <http://localhost:5173/watch/test-room>
- Backend: <http://localhost:3001>
- Health check: <http://localhost:3001/api/health>

To run an application independently, use `npm run dev --workspace client` or `npm run dev --workspace server`.

Use `npm run build` to build both applications and `npm run typecheck` to check their TypeScript code.

