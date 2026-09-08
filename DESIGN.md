# ViewParty Design

## Purpose

ViewParty is a learning-focused real-time systems project. The product is a small synchronized YouTube viewing room, but the main engineering goal is to learn and demonstrate real-time communication, concurrency, synchronization, reliability, and eventually distributed-systems tradeoffs.

The project should grow incrementally. Start with the simplest architecture that satisfies the current milestone, then introduce additional infrastructure only when a concrete requirement makes it useful.

## Product Goal

A user should eventually be able to create a temporary viewing party, share a short join code, have a small group join, and watch the same YouTube video together while playback remains synchronized.

### Target MVP

The intended MVP includes:

- Home page with Create Party and Join Party paths.
- Create a party with a creator username, party name, and YouTube URL.
- Generate a UUID as the internal session identifier.
- Generate a separate 5-character, case-insensitive alphanumeric join code for humans to share.
- Join an existing party with a username and join code.
- Maximum of 5 participants per party, including the creator.
- Usernames must be unique within a party, case-insensitively.
- Display the participant list in the watch room, with the creator first and marked with a crown.
- Embed the selected YouTube video and allow normal playback controls.
- Synchronize play, pause, and seek events between participants.
- Synchronize users who join after playback has already started.

Participant disconnect/removal behavior is not yet part of the committed MVP design. Do not invent it without an explicit milestone.

## Current Implementation

The repository currently has the first functional single-user milestone:

- React + TypeScript frontend using Vite.
- Node.js + TypeScript + Express backend.
- npm workspaces for `client` and `server`.
- `/create` creates a session through `POST /api/sessions`.
- Sessions are stored in an in-memory `Map` on the backend.
- Sessions use `crypto.randomUUID()` as their internal ID.
- `/watch/:sessionId` loads a session through `GET /api/sessions/:sessionId`.
- The watch page renders the stored YouTube URL with ReactPlayer.
- Playback is currently local to one browser; there is no synchronization yet.

The current `Session` shape is:

```ts
interface Session {
  id: string;
  name: string;
  videoUrl: string;
  createdAt: number;
}
```

## Architecture

### Repository

```text
ViewParty/
├── client/   React + TypeScript frontend
├── server/   Express + TypeScript backend
├── README.md
├── DESIGN.md
└── AGENTS.md
```

### Frontend

Use React + TypeScript and React Router.

Keep HTTP communication in the frontend `services` layer rather than spreading `fetch` calls throughout page components.

Current important pages:

```text
/create
/watch/:sessionId
```

Planned near-term pages:

```text
/
/join
```

ReactPlayer is the current YouTube integration. Keep it unless a future synchronization requirement demonstrates that its API is insufficient. Do not replace it with the raw YouTube IFrame API merely because the lower-level API exists.

### Backend

Maintain the existing separation:

```text
route -> controller -> service
```

Responsibilities:

- **Routes:** map HTTP endpoints to controllers.
- **Controllers:** parse/validate HTTP input and produce HTTP responses.
- **Services:** own session business logic and state changes.

Do not introduce repository/database abstractions while the application has no database.

### State

For the single-server MVP, active sessions should remain in backend process memory.

```text
Map<sessionId, Session>
```

This is intentional. Sessions are temporary and may disappear when the server restarts.

Do not add Redis or a persistent database simply to make the architecture look more production-like.

## Session Identity

ViewParty should use two different identifiers once joining is implemented.

### Internal session ID

Use a UUID for the canonical session ID and watch URL:

```text
/watch/:sessionId
```

### Join code

Generate a unique 5-character code using uppercase letters and digits, for example:

```text
A7K2Q
```

The join code is human-friendly discovery data only. Input should be case-insensitive.

The UUID should remain in the watch URL. A UUID is difficult to guess but is **not authentication** and must not be treated as a security boundary.

## Participant Model

The planned participant representation is intentionally small:

```ts
interface Participant {
  username: string;
  isCreator: boolean;
}
```

The creator is inserted first and counts toward the maximum room capacity of 5.

For the join milestone before WebSockets, participant membership may be stored permanently for the lifetime of the in-memory session. Closing a tab does not need to remove a participant until a later milestone explicitly adds presence/disconnect behavior.

## Real-Time Synchronization

WebSockets should be introduced only when synchronization work begins.

The exact WebSocket library is intentionally not fixed yet. Choose native WebSockets or a suitable higher-level library when implementing that milestone, and document the reason.

The intended model is server-authoritative playback state:

```text
Client action
    -> real-time message
    -> server validates/orders state transition
    -> server broadcasts authoritative result
    -> clients converge on that state
```

The server will eventually need enough playback state to reconstruct the current position for a late joiner. A likely conceptual state is:

```text
playing/paused
position at last update
server timestamp of last update
```

Do not continuously store the playback position every millisecond. When playing, current position can be derived from the last known position plus elapsed time.

The exact event ordering/versioning strategy should be chosen during the synchronization milestone rather than pre-built now.

## Reliability and Concurrency Goals

After basic synchronization works, extend the system specifically to study failure modes such as:

- Two users issuing conflicting playback commands nearly simultaneously.
- Stale or delayed commands.
- Client/server clock differences.
- Playback drift between clients.
- Lost WebSocket connections and reconnects.
- Late joins.
- Artificial network latency and dropped messages.

Manual testing can begin with multiple browser tabs. Later tests may use automated WebSocket clients to generate concurrent events.

## Scaling Direction

The MVP intentionally assumes a single backend process.

If the project is later extended as a scaling exercise, multiple backend instances create a new problem: each process has separate memory and separate WebSocket clients. At that point Redis may become useful for shared ephemeral room state and/or cross-server pub/sub.

Redis is therefore a future architectural response to multi-server requirements, not an MVP dependency.

A durable database is only justified if the product later requires long-lived data such as accounts, saved rooms, history, or persistent playlists.

## Deferred Infrastructure

Do not add these until a concrete milestone requires them:

- Redis
- PostgreSQL or MongoDB
- Docker solely for appearance/complexity
- Kubernetes
- Kafka
- authentication/accounts
- multi-server deployment

Docker can become useful later if the project gains external infrastructure such as Redis or a database, but it is not required for the current React + Node development setup.

## Suggested Milestone Progression

1. **Project skeleton** — frontend/backend structure and health endpoint.
2. **Session creation + local playback** — implemented in the current repository.
3. **Joining + participant membership** — home page, join codes, usernames, participant limit/list.
4. **Basic real-time synchronization** — play, pause, and seek across clients.
5. **Late join + authoritative playback state**.
6. **Reliability work** — conflicting commands, reconnects, drift correction, fault injection/testing.
7. **Optional distributed-systems extension** — multiple backend instances and Redis only if deliberately exploring horizontal scaling.

## Non-Goals

Unless a later milestone explicitly changes scope, ViewParty is not trying to become a production streaming platform. Avoid spending project complexity on:

- permanent user accounts
- durable watch history
- payments
- social feeds
- large-scale content discovery
- production-scale infrastructure
- elaborate UI design systems

The priority is correctness and learning around real-time state, concurrency, and reliability.