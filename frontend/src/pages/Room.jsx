import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import CodeMirror from "@uiw/react-codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { socket, connectSocket } from "../lib/socket.js";
import { initials, hueFromString } from "../lib/utils.js";

const LANGS = [
  { id: "javascript", label: "JavaScript", setup: () => [javascript({ jsx: true })] },
  { id: "python", label: "Python", setup: () => [python()] },
  { id: "html", label: "HTML", setup: () => [html()] },
  { id: "css", label: "CSS", setup: () => [css()] },
  { id: "plaintext", label: "Plain text", setup: () => [] },
];

const SAMPLES = {
  javascript:
    "// Welcome to CodeSync\n// Everything you type here is synced live for everyone in this room.\n\nfunction greet(name) {\n  return \"Hello, \" + name + \"!\";\n}\n\nconsole.log(greet(\"world\"));",
  python:
    "# Welcome to CodeSync\n# Everything you type here is synced live for everyone in this room.\n\ndef greet(name):\n    return f\"Hello, {name}!\"\n\nprint(greet(\"world\"))",
  html:
    "<!-- Welcome to CodeSync -->\n<h1>Hello, collaborators!</h1>\n<p>Start typing - everyone sees your changes instantly.</p>",
  css:
    "/* Welcome to CodeSync */\nbody {\n  font-family: system-ui, sans-serif;\n  background: #0b0f17;\n  color: #e2e8f0;\n}",
  plaintext:
    "Welcome to CodeSync!\nStart typing - everyone sees your changes instantly.",
};

export default function Room() {
  const { roomId } = useParams();
  const [room, setRoom] = useState({ title: "Untitled session", language: "javascript", code: "" });
  const [users, setUsers] = useState([]);
  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toasts, setToasts] = useState([]);
  const myIdRef = useRef(null);
  const roomRef = useRef(room);
  roomRef.current = room;

  const pushToast = (msg) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };

  useEffect(() => {
    connectSocket();

    const onConnect = () => {
      setConnected(true);
      socket.emit(
        "room:join",
        { roomId, userName: localStorage.getItem("codesync:name") || "Guest" },
        (res) => {
          if (!res?.ok) {
            pushToast(res?.error || "Could not join room");
            return;
          }
          myIdRef.current = res.you;
          const r = res.room;
          setRoom({
            title: r.title,
            language: r.language,
            code: r.code || SAMPLES[r.language] || SAMPLES.plaintext,
          });
          setJoined(true);
        }
      );
    };
    const onDisconnect = () => setConnected(false);
    const onCodeChange = ({ code, from }) => {
      if (from !== myIdRef.current) setRoom((r) => ({ ...r, code }));
    };
    const onLanguageChange = ({ language }) => setRoom((r) => ({ ...r, language }));
    const onTitleChange = ({ title }) => setRoom((r) => ({ ...r, title }));
    const onUserJoined = ({ userName, id }) => {
      if (id !== myIdRef.current) pushToast(`${userName || "Someone"} joined the room`);
    };
    const onUserLeft = ({ userName }) => pushToast(`${userName || "Someone"} left the room`);
    const onPresence = ({ users: next }) => setUsers(next || []);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("code:change", onCodeChange);
    socket.on("language:change", onLanguageChange);
    socket.on("title:change", onTitleChange);
    socket.on("user:joined", onUserJoined);
    socket.on("user:left", onUserLeft);
    socket.on("presence:update", onPresence);

    if (socket.connected) onConnect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("code:change", onCodeChange);
      socket.off("language:change", onLanguageChange);
      socket.off("title:change", onTitleChange);
      socket.off("user:joined", onUserJoined);
      socket.off("user:left", onUserLeft);
      socket.off("presence:update", onPresence);
      socket.emit("room:leave", { roomId });
    };
  }, [roomId]);

  const extensions = useMemo(
    () => LANGS.find((l) => l.id === room.language)?.setup() || [],
    [room.language]
  );

  const onCodeChange = (value) => {
    setRoom((r) => ({ ...r, code: value }));
    socket.emit("code:change", { roomId, code: value });
  };

  const onLanguageChange = (e) => {
    const language = e.target.value;
    setRoom((r) => ({ ...r, language }));
    socket.emit("language:change", { roomId, language });
  };

  const onTitleChange = (e) => {
    const title = e.target.value;
    setRoom((r) => ({ ...r, title }));
    socket.emit("title:change", { roomId, title });
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      pushToast("Copy failed - please copy the URL manually");
    }
  };

  return (
    <div className="page room-page">
      <header className="topbar room-topbar">
        <Link to="/" className="logo small">
          <span className="logo-mark">{"{ }"}</span>
          <span className="logo-text">CodeSync</span>
        </Link>

        <input
          className="title-input"
          value={room.title}
          maxLength={120}
          onChange={onTitleChange}
          placeholder="Untitled session"
          aria-label="Session title"
        />

        <div className="room-meta">
          <button className="room-chip mono" onClick={copyLink} title="Copy invite link">
            {roomId}
            <span className="copy-hint">{copied ? "Copied" : "Copy"}</span>
          </button>

          <div className="presence" title={(users.map((u) => u.userName).join(", ") || "Nobody") + " in room"}>
            {users.slice(0, 4).map((u) => (
              <span
                key={u.id}
                className="avatar"
                style={{ background: `hsl(${hueFromString(u.userName)} 55% 38%)` }}
              >
                {initials(u.userName)}
              </span>
            ))}
            {users.length > 4 && <span className="avatar more">+{users.length - 4}</span>}
            <span className="presence-count">{users.length} online</span>
          </div>

          <span className={"dot " + (connected ? "on" : "off")} title={connected ? "Connected" : "Disconnected"} />
        </div>
      </header>

      <main className="room-main">
        <div className="toolbar">
          <label className="field-label" htmlFor="lang">
            Language
          </label>
          <select id="lang" value={room.language} onChange={onLanguageChange}>
            {LANGS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
          <span className="toolbar-hint">
            {joined ? "Syncing live - everyone in this room sees your edits" : "Connecting to room..."}
          </span>
        </div>

        <div className="editor-wrap">
          <CodeMirror
            className="editor"
            value={room.code}
            theme={oneDark}
            height="560px"
            extensions={extensions}
            onChange={onCodeChange}
            basicSetup={{ lineNumbers: true, highlightActiveLine: true, foldGutter: true, autocompletion: true }}
          />
        </div>
      </main>

      <div className="toast-stack">
        {toasts.map((t) => (
          <div key={t.id} className="toast info">
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
