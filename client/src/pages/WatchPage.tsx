import { useEffect, useState } from "react";
import ReactPlayer from "react-player";
import { Link, useParams } from "react-router-dom";
import { getSession } from "../services/sessionApi";
import type { Session } from "../types/Session";

function WatchPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadSession() {
      if (!sessionId) {
        setError("Session not found.");
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
  }, [sessionId]);

  if (isLoading) {
    return <p className="page-status">Loading session...</p>;
  }

  if (error || !session) {
    return <p className="page-status error">{error || "Session not found."}</p>;
  }

  return (
    <section className="panel room" aria-labelledby="room-heading">
      <p className="eyebrow">ViewParty</p>
      <h1 id="room-heading">{session.name}</h1>

      <div className="video-player">
        <ReactPlayer src={session.videoUrl} controls width="100%" height="100%" />
      </div>

      <Link className="back-button" to="/">
        Back to home
      </Link>
    </section>
  );
}

export default WatchPage;
