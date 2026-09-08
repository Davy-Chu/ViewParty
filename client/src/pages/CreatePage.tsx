import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createSession } from "../services/sessionApi";

function CreatePage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const session = await createSession(name, videoUrl);
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
      <h1 id="create-heading">Create a watch session</h1>
      <p className="intro">Choose a name and YouTube video for your watch session.</p>

      <form onSubmit={handleSubmit}>
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
          {isLoading ? "Creating..." : "Create Session"}
        </button>
      </form>

      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

export default CreatePage;
