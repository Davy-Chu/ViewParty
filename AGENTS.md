# AGENTS.md

## Purpose

This file defines how coding agents should work in the ViewParty repository.

Before making architectural or cross-cutting changes, read `DESIGN.md` and the current implementation first. Treat `DESIGN.md` as the high-level product/architecture direction and the active task or milestone prompt as the source of truth for what should be implemented now.

Do not implement future milestones unless explicitly requested.

## Project Priorities

ViewParty is primarily a learning project for:

- real-time communication
- concurrency
- synchronization
- reliability
- distributed-systems tradeoffs

Prefer designs that make those concepts clear and testable. UI polish is secondary unless the current task specifically requests it.

## Current Stack

Frontend:

- React
- TypeScript
- Vite
- React Router
- ReactPlayer

Backend:

- Node.js
- TypeScript
- Express

Repository:

- npm workspaces
- `client/`
- `server/`

Do not replace the stack without an explicit requirement.

## Existing Architecture

### Frontend

Keep page components focused on UI/state orchestration.

HTTP calls should live in the frontend services layer when practical:

```text
client/src/services/
```

Shared frontend domain types belong in:

```text
client/src/types/
```

Reuse the existing React Router structure rather than introducing a second routing approach.

### Backend

Preserve the current flow:

```text
route -> controller -> service
```

Use these responsibilities:

- `routes/`: endpoint registration only
- `controllers/`: HTTP parsing, basic validation, status codes, response mapping
- `services/`: session business logic and in-memory state mutations
- `models/`: domain interfaces/types

Do not place session business logic directly in route files.

Do not add a repository/data-access layer while no database exists.

## Simplicity Rule

Implement the smallest design that correctly satisfies the current milestone.

Do not add technology because it may be useful later.

In particular, do not add any of the following unless the active milestone creates a concrete requirement:

- Redis
- PostgreSQL
- MongoDB
- Docker
- Kubernetes
- Kafka
- authentication
- background workers
- multi-server infrastructure
- WebSockets / Socket.IO

When a future requirement does justify one of these, explain the problem it solves before introducing it.

## Session Storage

The current server intentionally stores sessions in process memory.

Keep this approach for the single-server MVP unless explicitly instructed otherwise.

It is acceptable for all sessions to disappear when the backend restarts.

Do not add persistence solely to prevent that behavior.

## Session and Join Identifiers

The canonical session identifier is a UUID.

The watch route should continue to use:

```text
/watch/:sessionId
```

The planned short 5-character join code is separate from the UUID. It is intended for human-friendly joining and must not replace the UUID in the watch URL unless a future task explicitly changes that decision.

Do not treat either identifier as authentication.

## ReactPlayer

Keep ReactPlayer as the YouTube playback abstraction unless a concrete synchronization requirement cannot be implemented cleanly with it.

Do not replace it with the raw YouTube IFrame API preemptively.

If a future task requires changing the player abstraction, document exactly which missing capability forced the change.

## Real-Time Work

Do not introduce real-time communication before the milestone that explicitly requests synchronization or live presence.

When WebSockets are eventually added:

- keep the server authoritative for shared playback state
- separate transport/event handling from domain state transitions where practical
- avoid client-to-client authority
- design for late joins and reconnects explicitly
- make event-ordering decisions explicit rather than relying accidentally on timing

Do not add Redis merely because WebSockets are present. Redis is only expected if the project deliberately moves to multiple backend processes or another concrete coordination requirement appears.

## Concurrency

When implementing state-changing session operations, keep related checks and mutations together in the service layer.

For example, a future join operation should conceptually keep:

```text
check room exists
check capacity
check username uniqueness
add participant
```

inside one backend service operation rather than splitting it across unrelated layers.

Do not introduce distributed locks for a single-process Node.js milestone unless a demonstrated problem requires them.

## Validation and Error Handling

Use simple, explicit validation appropriate to the current task.

Return meaningful HTTP status codes and small JSON error responses.

Do not introduce a large validation framework for a handful of fields unless the project grows enough to justify one.

Frontend errors should remain understandable to the user and preserve entered form state when possible.

## Scope Control

Avoid implementing adjacent features that were not requested.

Examples:

- If implementing joining, do not also implement WebSocket presence unless requested.
- If implementing playback sync, do not also add Redis/multi-server support unless requested.
- If implementing reconnect logic, do not create authentication/accounts unless requested.

A milestone should remain reviewable as one coherent change.

## Code Quality

Prefer:

- clear names
- small functions
- explicit types
- straightforward control flow
- existing project conventions

Avoid:

- speculative abstractions
- generic framework layers with one implementation
- duplicated domain types within the same application layer
- large refactors unrelated to the requested feature
- comments that restate obvious code

## Before Finishing a Change

Run the relevant repository checks.

At minimum, when the change touches both applications, use:

```bash
npm run typecheck
npm run build
```

If tests exist for the modified area, run them as well.

Do not claim a command passed unless it was actually run successfully.

Preserve existing health-check behavior and unrelated functionality unless the task explicitly changes them.

## Documentation

Update `README.md` when setup, run instructions, or current user-visible capabilities materially change.

Update `DESIGN.md` only when a high-level product or architecture decision changes. Do not turn `DESIGN.md` into a changelog or implementation log.

Use the milestone/task prompt for temporary implementation details rather than permanently documenting every intermediate step.

## Architectural Changes

If a requested feature requires a meaningful architectural change:

1. Inspect the existing implementation first.
2. Prefer adapting the current architecture over replacing it.
3. Explain the new requirement that makes the change necessary.
4. Keep the change limited to what is required now.

Do not silently introduce infrastructure or restructure the entire repository.

## Product Constraints Currently Established

Unless a newer milestone overrides them:

- parties are temporary
- backend is single-server for the MVP
- session state is in memory
- maximum planned party size is 5 users
- creator counts toward the limit
- usernames within a party are case-insensitively unique
- creator should appear first in the member list and be visually marked with a crown
- join codes are 5-character alphanumeric codes and are case-insensitive on input
- UUID remains the internal session ID and URL identifier
- no user-leaving/presence behavior should be invented before its milestone
- no long-term storage is currently required

## Guiding Principle

When unsure between a simple solution that satisfies the current milestone and a more production-like solution that anticipates future scale, choose the simple solution unless the future concern is already causing a real problem in the current system.
