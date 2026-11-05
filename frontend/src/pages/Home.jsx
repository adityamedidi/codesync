import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { genRoomCode, timeAgo } from "../lib/utils.js";

const FEATURES = [
  {
    title: "Real-time editing",
    text: "Every keystroke is streamed through Socket.IO to everyone in the room in under a millisecond.",
  },
  {
    title: "Multi-language support",
    text: "JavaScript, Python, HTML and CSS with full syntax highlighting powered by CodeMirror 6.",
  },
  {
    title: "Zero setup",
    text: "No accounts, no installs. Create a room, share the link and start typing together.",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [name, setName] = useState(() => localStorage.getItem("codesync:name") || "");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [recent, setRecent] = useState(null);

  useEffect(() => {
    let mounted = true;
    api
      .recentRooms()
      .then((rooms) => mounted && setRecent(rooms || []))
      .catch(() => mounted && setRecent([]));
    return () => {
      mounted = false;
    };
  }, []);

  const saveName = (value) => {
    setName(value);
    localStorage.setItem("codesync:name", value.trim() || "Guest");
  };

  const createRoom = () => {
    saveName(name);
    navigate(`/room/${genRoomCode()}`);
  };

  const joinRoom = (e) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) {
      setError("Room codes are at least 4 characters.");
      return;
    }
    setError("");
    saveName(name);
    navigate(`/room/${code}`);
  };

  return (
    <div className="page">
      <header className="topbar">
        <div className="logo">
          <span className="logo-mark">{"{ }"}</span>
          <span className="logo-text">CodeSync</span>
        </div>
        <a className="github-link" href="https://github.com" target="_blank" rel="noreferrer">
          Star on GitHub
        </a>
      </header>

      <main className="container">
        <section className="hero">
          <h1>
            Code together,
            <br />
            <span className="grad">in real time.</span>
          </h1>
          <p className="hero-sub">
            CodeSync is a live collaborative editor built on the MERN stack. Open a room,
            share the link, and watch your team's code appear as they type.
          </p>
        </section>

        <section className="start-card">
          <div className="start-row">
            <label className="field">
              <span className="field-label">Your name</span>
              <input
                value={name}
                maxLength={24}
                placeholder="e.g. ada"
                onChange={(e) => setName(e.target.value)}
                onBlur={(e) => saveName(e.target.value)}
              />
            </label>
            <button className="btn primary" onClick={createRoom}>
              Create a new room
            </button>
          </div>
          <div className="divider">
            <span>or join an existing one</span>
          </div>
          <form className="start-row" onSubmit={joinRoom}>
            <label className="field grow">
              <span className="field-label">Room code</span>
              <input
                className="mono"
                value={joinCode}
                maxLength={12}
                placeholder="e.g. K7QP2M"
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              />
            </label>
            <button className="btn ghost" type="submit">
              Join room
            </button>
          </form>
          {error && <div className="inline-error">{error}</div>}
        </section>

        <section className="features">
          {FEATURES.map((f) => (
            <article className="card feature" key={f.title}>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          ))}
        </section>

        {recent && recent.length > 0 && (
          <section className="recent">
            <h2>Recently active rooms</h2>
            <div className="recent-list">
              {recent.map((r) => (
                <button
                  key={r.roomId}
                  className="recent-row"
                  onClick={() => {
                    saveName(name);
                    navigate(`/room/${r.roomId}`);
                  }}
                >
                  <span className="mono room-id">{r.roomId}</span>
                  <span className="recent-title">{r.title}</span>
                  <span className="badge">{r.language}</span>
                  <span className="recent-time">{timeAgo(r.updatedAt)}</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="footer">
        Built with MongoDB, Express, React, Node.js and Socket.IO
      </footer>
    </div>
  );
}
