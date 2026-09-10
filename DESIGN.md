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

Participant membership reflects active Socket.IO connections. Disconnecting removes a participant, and the oldest remaining participant becomes host when the current host leaves.

## Current Implementation

The repository currently supports real-time party presence, chat, and basic playback synchronization:

- React + TypeScript frontend using Vite.
- Node.js + TypeScript + Express backend.
- npm workspaces for `client` and `server`.
- `/create` creates a session and `/join` performs join preflight through HTTP.
- Sessions are stored in an in-memory `Map` on the backend.
- Sessions use `crypto.randomUUID()` as their internal ID.
- `/watch/:sessionId` loads a session through `GET /api/sessions/:sessionId`.
- The watch page renders the stored YouTube URL with ReactPlayer.
- Socket.IO provides active presence, participant updates, host transfer, transient system messages, ephemeral room chat, and synchronized play/pause commands.
- The server owns authoritative playback state and sends a freshly derived position to late joiners.
- Manual seek synchronization, periodic drift correction, and command versioning are not implemented yet.

The current `Session` shape is:

```ts
interface Session {
  id: string;
  joinCode: string;
  name: string;
  videoUrl: string;
  createdAt: number;
  creatorUsername: string;
  hostUsername: string | null;
  participants: Participant[];
  playback: {
    isPlaying: boolean;
    position: number;
    updatedAt: number;
  };
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

Current pages:

```text
/
/create
/join
/watch/:sessionId
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
- **Socket handlers:** translate Socket.IO events into service calls and room broadcasts.

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

Active server-side participants are intentionally small:

```ts
interface Participant {
  username: string;
  socketId: string;
}
```

Socket IDs stay on the server. Clients receive a public participant view containing only `username` and a derived `isHost` value.

The creator is the initial host but only becomes an active participant after entering the watch page over Socket.IO. Active participants preserve connection order and count toward the maximum room capacity of 5. When the host disconnects, the first remaining participant becomes host; an empty party has no host, and its next admitted participant becomes host.

## Presence and Temporary Identity

Socket.IO is the selected real-time transport and uses the session UUID as its room identifier. HTTP joining only validates that a join attempt currently appears valid; it does not mutate active membership. Socket.IO admission repeats the session, capacity, and case-insensitive username checks and is authoritative, preventing HTTP preflight races from exceeding capacity or duplicating an active username.

The browser stores a party username under `viewparty:<sessionId>:username` in `sessionStorage`. This provides temporary identity scoped to a browser tab and survives ordinary refreshes, but it is not authentication. Disconnects immediately remove active presence, transfer host status when necessary, and emit transient system messages. No presence or message history is persisted. Redis remains unnecessary because one backend process owns all sessions and Socket.IO connections.

## Room Chat

Room chat reuses the admitted Socket.IO connection and UUID-based room. Clients submit message text only; the server resolves the sender and destination from active socket presence, trims and validates the message against a 500-character maximum, and broadcasts accepted messages to the full room including the sender. Chat has no timestamps, history, replay, or persistence.

## Real-Time Synchronization

Socket.IO rooms provide server-authoritative play and pause synchronization over the same admitted connection used for presence and chat:

```text
Client action
    -> real-time message
    -> server validates/orders state transition
    -> server broadcasts authoritative result
    -> clients converge on that state
```

Each session stores:

```text
playing/paused
position at last update
server timestamp of last update
```

The server does not continuously update the stored position. When playback is active, it derives a current snapshot from the stored position plus elapsed server time. This lets a newly admitted socket receive a fresh playback state immediately.

An admitted client sends a `playback:command` containing only an action and its current player position. The server verifies the socket's active membership, validates the command, records it with a server timestamp, then broadcasts `playback:state` to the entire room including the sender. Each accepted command also produces exactly one transient play or pause system message. Commands are handled in server arrival order, so the last processed command wins.

Clients apply the authoritative snapshot to ReactPlayer and suppress the resulting programmatic play or pause callback when a real local transition is required. Manual seeking is intentionally local for now. Command acknowledgements, periodic drift correction, sequence numbers, reconnection recovery beyond normal room admission, and multi-server ordering are deferred until a concrete reliability milestone requires them.

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
3. **Joining + participant membership** — home page, join codes, usernames, and participant limits.
4. **Real-time presence** — active membership, host transfer, and system messages, implemented in the current repository.
5. **Room chat** — ephemeral user messages over the admitted room connection.
6. **Basic real-time synchronization** — server-authoritative play/pause and late-join state, implemented in the current repository.
7. **Seek and reliability work** — seek synchronization, conflicting commands, reconnects, drift correction, fault injection/testing.
8. **Optional distributed-systems extension** — multiple backend instances and Redis only if deliberately exploring horizontal scaling.

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
