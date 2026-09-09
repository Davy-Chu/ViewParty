import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createSession } from "../services/sessionApi";

function CreatePage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const session = await createSession(username, name, videoUrl);
      sessionStorage.setItem(
        `viewparty:${session.id}:username`,
        username.trim(),
      );
      navigate(`/watch/${session.id}`);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to create the session. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="panel" aria-labelledby="create-heading">
      <p className="eyebrow">ViewParty</p>
      <h1 id="create-heading">Create Party</h1>
      <p className="intro">Choose your username, party name, and YouTube video.</p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="creator-username">Username</label>
        <input
          id="creator-username"
          name="username"
          type="text"
          placeholder="David"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
        />

        <label htmlFor="session-name">Session name</label>
        <input
          id="session-name"
          name="sessionName"
          type="text"
          placeholder="Friday movie night"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />

        <label htmlFor="video-url">YouTube URL</label>
        <input
          id="video-url"
          name="videoUrl"
          type="url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={videoUrl}
          onChange={(event) => setVideoUrl(event.target.value)}
          required
        />

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Party"}
        </button>
      </form>

      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}

      <Link className="back-link" to="/">
        Back to home
      </Link>
    </section>
  );
}

export default CreatePage;
