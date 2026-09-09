import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { joinSession } from "../services/sessionApi";

function JoinPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const session = await joinSession(username, joinCode);
      sessionStorage.setItem(
        `viewparty:${session.id}:username`,
        username.trim(),
      );
      navigate(`/watch/${session.id}`);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to join the party. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleJoinCodeChange(value: string) {
    setJoinCode(value.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 5));
  }

  return (
    <section className="panel" aria-labelledby="join-heading">
      <p className="eyebrow">ViewParty</p>
      <h1 id="join-heading">Join Party</h1>

      <form onSubmit={handleSubmit}>
        <label htmlFor="join-username">Username</label>
        <input
          id="join-username"
          name="username"
          type="text"
          placeholder="Alice"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          required
        />

        <label htmlFor="join-code">Party Code</label>
        <input
          id="join-code"
          className="join-code-input"
          name="joinCode"
          type="text"
          placeholder="A7K2Q"
          value={joinCode}
          onChange={(event) => handleJoinCodeChange(event.target.value)}
          maxLength={5}
          minLength={5}
          pattern="[A-Z0-9]{5}"
          autoComplete="off"
          required
        />

        <button type="submit" disabled={isLoading}>
          {isLoading ? "Joining..." : "Join Party"}
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

export default JoinPage;
