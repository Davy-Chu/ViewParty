import { useEffect, useState } from "react";
import ReactPlayer from "react-player";
import { Link, useParams } from "react-router-dom";
import { getSession } from "../services/sessionApi";
import { sessionSocket } from "../services/socket";
import { MAX_PARTICIPANTS } from "../types/Session";
import type {
  AdmissionError,
  ParticipantView,
  Session,
  SystemMessage,
} from "../types/Session";

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
  const [systemMessages, setSystemMessages] = useState<SystemMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [presenceError, setPresenceError] = useState("");

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
    setSystemMessages([]);
    setPresenceError("");

    function enterSession() {
      sessionSocket.emit(
        "session:enter",
        { sessionId: sessionId as string, username: username as string },
        (response) => {
          if (!isActive) {
            return;
          }

          if (!response.ok) {
            setPresenceError(admissionErrorMessages[response.error]);
            sessionSocket.disconnect();
            return;
          }

          setPresenceError("");
        },
      );
    }

    function handleParticipantsUpdated(updatedParticipants: ParticipantView[]) {
      setParticipants(updatedParticipants);
    }

    function handleSystemMessage(message: SystemMessage) {
      setSystemMessages((currentMessages) => [...currentMessages, message]);
    }

    function handleConnectionError() {
      setPresenceError("Unable to connect to the party.");
    }

    sessionSocket.on("connect", enterSession);
    sessionSocket.on("participants:updated", handleParticipantsUpdated);
    sessionSocket.on("system:message", handleSystemMessage);
    sessionSocket.on("connect_error", handleConnectionError);

    if (sessionSocket.connected) {
      enterSession();
    } else {
      sessionSocket.connect();
    }

    return () => {
      isActive = false;
      sessionSocket.off("connect", enterSession);
      sessionSocket.off("participants:updated", handleParticipantsUpdated);
      sessionSocket.off("system:message", handleSystemMessage);
      sessionSocket.off("connect_error", handleConnectionError);
      sessionSocket.disconnect();
    };
  }, [sessionId, username]);

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
            <ReactPlayer src={session.videoUrl} controls width="100%" height="100%" />
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
            <div className="system-messages" aria-live="polite">
              {systemMessages.length === 0 ? (
                <p className="chat-empty">System messages will appear here.</p>
              ) : (
                systemMessages.map((message, index) => (
                  <p key={`${message.type}-${message.username}-${index}`}>
                    {message.message}
                  </p>
                ))
              )}
            </div>

            <div className="chat-controls">
              <input type="text" placeholder="Chat coming soon..." disabled />
              <button type="button" disabled>
                Send
              </button>
            </div>
          </section>
        </aside>
      </div>
    </section>
  );
}

export default WatchPage;
