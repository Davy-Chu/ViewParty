import { useParams } from "react-router-dom";

function WatchPage() {
  const { sessionId } = useParams<{ sessionId: string }>();

  return (
    <section className="panel room" aria-labelledby="room-heading">
      <p className="eyebrow">ViewParty</p>
      <h1 id="room-heading">Room: {sessionId}</h1>

      <div className="video-placeholder" role="img" aria-label="Video player placeholder">
        <span>Video Player Placeholder</span>
      </div>

      <aside className="participants" aria-label="Participant status">
        <h2>Participants</h2>
        <p>Participant status will appear here.</p>
      </aside>

      <p className="notice">Playback synchronization will be implemented in a later milestone.</p>
    </section>
  );
}

export default WatchPage;

