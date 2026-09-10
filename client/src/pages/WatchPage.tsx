import { useEffect, useRef, useState } from "react";
import type { FormEvent, SyntheticEvent } from "react";
import ReactPlayer from "react-player";
import { Link, useParams } from "react-router-dom";
import { getSession } from "../services/sessionApi";
import { sessionSocket } from "../services/socket";
import { MAX_CHAT_MESSAGE_LENGTH, MAX_PARTICIPANTS } from "../types/Session";
import type {
  AdmissionError,
  ChatMessage,
  ParticipantView,
  PlaybackCommand,
  PlaybackStateView,
  RoomMessage,
  Session,
  SystemMessage,
} from "../types/Session";

const PLAYBACK_SEEK_TOLERANCE_SECONDS = 0.5;

const admissionErrorMessages: Record<AdmissionError, string> = {
  session_not_found: "Session not found.",
  party_full: "Party is full.",
  username_taken: "Username is already taken.",
  invalid_identity: "You must create or join this party first.",
};

function WatchPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const username = sessionId
    ? sessionStorage.getItem(`viewparty:${sessionId}:username`)?.trim()
    : undefined;
  const [session, setSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<ParticipantView[]>([]);
  const [roomMessages, setRoomMessages] = useState<RoomMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isAdmitted, setIsAdmitted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [presenceError, setPresenceError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLVideoElement>(null);
  const latestPositionRef = useRef(0);
  const latestPlaybackStateRef = useRef<PlaybackStateView | null>(null);
  const suppressNextPlaybackEvent = useRef<PlaybackCommand["action"] | null>(null);

  function applyPlaybackState(playback: PlaybackStateView) {
    latestPlaybackStateRef.current = playback;
    latestPositionRef.current = playback.position;

    const player = playerRef.current;

    if (player) {
      if (
        !Number.isFinite(player.currentTime) ||
        Math.abs(player.currentTime - playback.position) >
          PLAYBACK_SEEK_TOLERANCE_SECONDS
      ) {
        try {
          player.currentTime = playback.position;
        } catch {
          // The media may not be seekable until onReady retries this snapshot.
        }
      }

      const requiredAction = playback.isPlaying ? "play" : "pause";
      const requiresTransition = playback.isPlaying ? player.paused : !player.paused;
      suppressNextPlaybackEvent.current = requiresTransition ? requiredAction : null;
    } else {
      suppressNextPlaybackEvent.current = playback.isPlaying ? "play" : null;
    }

    setIsPlaying(playback.isPlaying);
  }

  function handlePlaybackEvent(
    action: PlaybackCommand["action"],
    event: SyntheticEvent<HTMLVideoElement>,
  ) {
    if (Number.isFinite(event.currentTarget.currentTime)) {
      latestPositionRef.current = event.currentTarget.currentTime;
    }

    if (suppressNextPlaybackEvent.current === action) {
      suppressNextPlaybackEvent.current = null;
      return;
    }

    if (!isAdmitted || !sessionSocket.connected) {
      return;
    }

    sessionSocket.emit("playback:command", {
      action,
      position: latestPositionRef.current,
    });
  }

  function handlePlayerReady() {
    if (latestPlaybackStateRef.current) {
      applyPlaybackState(latestPlaybackStateRef.current);
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    setSession(null);
    setError("");
    setIsLoading(true);

    async function loadSession() {
      if (!sessionId || !username) {
        setIsLoading(false);
        return;
      }

      try {
        const loadedSession = await getSession(sessionId, controller.signal);
        setSession(loadedSession);
      } catch (caughtError) {
        if (!controller.signal.aborted) {
          setError(
            caughtError instanceof Error ? caughtError.message : "Session not found.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadSession();
    return () => controller.abort();
  }, [sessionId, username]);

  useEffect(() => {
    if (!sessionId || !username) {
      return;
    }

    let isActive = true;

    setParticipants([]);
    setRoomMessages([]);
    setChatInput("");
    setIsAdmitted(false);
    setIsPlaying(false);
    setPresenceError("");
    latestPositionRef.current = 0;
    latestPlaybackStateRef.current = null;
    suppressNextPlaybackEvent.current = null;

    function enterSession() {
      sessionSocket.emit(
        "session:enter",
        { sessionId: sessionId as string, username: username as string },
        (response) => {
          if (!isActive) {
            return;
          }

          if (!response.ok) {
            setIsAdmitted(false);
            setPresenceError(admissionErrorMessages[response.error]);
            sessionSocket.disconnect();
            return;
          }

          setIsAdmitted(true);
          setPresenceError("");
        },
      );
    }

    function handleParticipantsUpdated(updatedParticipants: ParticipantView[]) {
      setParticipants(updatedParticipants);
    }

    function handleSystemMessage(message: SystemMessage) {
      setRoomMessages((currentMessages) => [
        ...currentMessages,
        { type: "system", message: message.message },
      ]);
    }

    function handleChatMessage(message: ChatMessage) {
      setRoomMessages((currentMessages) => [
        ...currentMessages,
        { type: "chat", username: message.username, message: message.message },
      ]);
    }

    function handlePlaybackState(playback: PlaybackStateView) {
      applyPlaybackState(playback);
    }

    function handleConnectionError() {
      setIsAdmitted(false);
      setPresenceError("Unable to connect to the party.");
    }

    function handleDisconnect() {
      setIsAdmitted(false);
    }

    sessionSocket.on("chat:message", handleChatMessage);
    sessionSocket.on("connect", enterSession);
    sessionSocket.on("disconnect", handleDisconnect);
    sessionSocket.on("participants:updated", handleParticipantsUpdated);
    sessionSocket.on("playback:state", handlePlaybackState);
    sessionSocket.on("system:message", handleSystemMessage);
    sessionSocket.on("connect_error", handleConnectionError);

    if (sessionSocket.connected) {
      enterSession();
    } else {
      sessionSocket.connect();
    }

    return () => {
      isActive = false;
      sessionSocket.off("chat:message", handleChatMessage);
      sessionSocket.off("connect", enterSession);
      sessionSocket.off("disconnect", handleDisconnect);
      sessionSocket.off("participants:updated", handleParticipantsUpdated);
      sessionSocket.off("playback:state", handlePlaybackState);
      sessionSocket.off("system:message", handleSystemMessage);
      sessionSocket.off("connect_error", handleConnectionError);
      sessionSocket.disconnect();
    };
  }, [sessionId, username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ block: "nearest" });
  }, [roomMessages]);

  function handleChatSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const message = chatInput.trim();

    if (
      !isAdmitted ||
      !sessionSocket.connected ||
      message.length === 0 ||
      message.length > MAX_CHAT_MESSAGE_LENGTH
    ) {
      return;
    }

    sessionSocket.emit("chat:send", { message });
    setChatInput("");
  }

  const canSendChat =
    isAdmitted &&
    chatInput.trim().length > 0 &&
    chatInput.length <= MAX_CHAT_MESSAGE_LENGTH;

  if (!sessionId || !username) {
    return (
      <section className="page-status identity-message">
        <p>You must create or join this party first.</p>
        <Link className="back-link" to="/">
          Back to home
        </Link>
      </section>
    );
  }

  if (isLoading) {
    return <p className="page-status">Loading session...</p>;
  }

  if (error || !session) {
    return <p className="page-status error">{error || "Session not found."}</p>;
  }

  if (presenceError) {
    return (
      <section className="page-status identity-message">
        <p className="error">{presenceError}</p>
        <Link className="back-link" to="/join">
          Back to join
        </Link>
      </section>
    );
  }

  return (
    <section className="panel room" aria-labelledby="room-heading">
      <p className="eyebrow">ViewParty</p>
      <h1 id="room-heading">{session.name}</h1>
      <p className="party-code">
        Party Code: <strong>{session.joinCode}</strong>
      </p>

      <div className="watch-layout">
        <div className="watch-main">
          <div className="video-player">
            <ReactPlayer
              ref={playerRef}
              src={session.videoUrl}
              playing={isPlaying}
              controls
              width="100%"
              height="100%"
              onReady={handlePlayerReady}
              onTimeUpdate={(event) => {
                if (Number.isFinite(event.currentTarget.currentTime)) {
                  latestPositionRef.current = event.currentTarget.currentTime;
                }
              }}
              onPlay={(event) => handlePlaybackEvent("play", event)}
              onPause={(event) => handlePlaybackEvent("pause", event)}
            />
          </div>

          <Link className="back-button" to="/">
            Back to home
          </Link>
        </div>

        <aside className="party-sidebar">
          <section className="participants" aria-labelledby="participants-heading">
            <div className="participants-header">
              <h2 id="participants-heading">Members</h2>
              <span>
                {participants.length}/{MAX_PARTICIPANTS}
              </span>
            </div>

            <ul className="participant-list">
              {participants.map((participant) => (
                <li key={participant.username}>
                  {participant.isHost && (
                    <span className="host-crown" aria-label="Host" title="Host">
                      {"\uD83D\uDC51"}
                    </span>
                  )}
                  {participant.username}
                </li>
              ))}
            </ul>
          </section>

          <section className="chat-panel" aria-labelledby="chat-heading">
            <h2 id="chat-heading">Chat</h2>
            <div className="room-messages" aria-live="polite">
              {roomMessages.length === 0 ? (
                <p className="chat-empty">Messages will appear here.</p>
              ) : (
                roomMessages.map((message, index) =>
                  message.type === "system" ? (
                    <p className="system-message" key={`system-${index}`}>
                      {message.message}
                    </p>
                  ) : (
                    <p className="chat-message" key={`chat-${index}`}>
                      <strong>{message.username}:</strong> {message.message}
                    </p>
                  ),
                )
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-controls" onSubmit={handleChatSubmit}>
              <input
                type="text"
                aria-label="Chat message"
                placeholder="Send a message..."
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                maxLength={MAX_CHAT_MESSAGE_LENGTH}
                autoComplete="off"
                disabled={!isAdmitted}
              />
              <button type="submit" disabled={!canSendChat}>
                Send
              </button>
            </form>
          </section>
        </aside>
      </div>
    </section>
  );
}

export default WatchPage;
