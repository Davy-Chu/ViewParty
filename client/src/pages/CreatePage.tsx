import { FormEvent, useState } from "react";

function CreatePage() {
  const [message, setMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Session creation not implemented yet.");
  }

  return (
    <section className="panel" aria-labelledby="create-heading">
      <p className="eyebrow">ViewParty</p>
      <h1 id="create-heading">Create a watch session</h1>
      <p className="intro">Choose a name and media URL for your future room.</p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="session-name">Session name</label>
        <input id="session-name" name="sessionName" type="text" placeholder="Friday movie night" />

        <label htmlFor="video-url">Video URL</label>
        <input id="video-url" name="videoUrl" type="url" placeholder="https://example.com/video" />

        <button type="submit">Create Session</button>
      </form>

      {message && <p className="notice" role="status">{message}</p>}
    </section>
  );
}

export default CreatePage;

