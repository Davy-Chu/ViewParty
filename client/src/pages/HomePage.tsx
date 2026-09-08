import { Link } from "react-router-dom";

function HomePage() {
  return (
    <section className="panel home-panel" aria-labelledby="home-heading">
      <p className="eyebrow">ViewParty</p>
      <h1 id="home-heading">Watch Together</h1>
      <p className="intro">Create a new party or join one with a party code.</p>

      <nav className="home-actions" aria-label="Party actions">
        <Link className="primary-link" to="/create">
          Create Party
        </Link>
        <Link className="secondary-link" to="/join">
          Join Party
        </Link>
      </nav>
    </section>
  );
}

export default HomePage;
