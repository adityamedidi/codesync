# CodeSync

Real-time collaborative code editor built with the **MERN stack** (MongoDB, Express, React, Node.js) and **Socket.IO**. Create a room, share the link, and everyone's keystrokes appear instantly for the whole team - like Google Docs for code.

## Features

- **Live collaborative editing** - every change is streamed through Socket.IO to all room members in real time
- **Presence** - see who is in the room with colored avatars, plus join/leave notifications
- **5 languages** - JavaScript, Python, HTML, CSS and plain text, with CodeMirror 6 syntax highlighting and the One Dark theme
- **Session titles** - rename the session and everyone sees it
- **Autosave** - room state is saved (debounced) to MongoDB, so refreshers get the latest code
- **Recent rooms** - the home page lists the most recently active rooms
- **Zero setup for users** - no accounts; pick a display name and go
- **Works without MongoDB** - if no database is reachable, the backend falls back to an in-memory store (data resets on restart)

## Tech stack

| Layer     | Technology                          |
| --------- | ----------------------------------- |
| Frontend  | React 18 + Vite, React Router, CodeMirror 6, socket.io-client |
| Backend   | Node.js, Express, Socket.IO         |
| Database  | MongoDB via Mongoose (with in-memory fallback) |

## Quick start

Prerequisite: **Node.js 18+**. MongoDB is optional (see the fallback note above).

```bash
# 1. install everything (root + backend + frontend)
npm run install-all

# 2. start backend (port 5000) + frontend dev server (port 5173) together
npm run dev
```

Then open **http://localhost:5173**, enter a name, click "Create a new room" and share the URL.

### Optional: enable persistence

1. Install and start MongoDB locally, or point at MongoDB Atlas
2. Copy `.env.example` to `backend/.env` and set `MONGO_URI`
3. Restart - the console will confirm `MongoDB connected`

## Production build

```bash
npm run build   # builds the React app into frontend/dist
npm start       # Express serves the API, sockets AND the built app on :5000
```

## Project structure

```
codesync/
├── package.json            # root scripts (install-all / dev / build / start)
├── backend/
│   ├── server.js           # Express + Socket.IO bootstrap
│   ├── config/db.js        # MongoDB connection (graceful fallback)
│   ├── models/Room.js      # Mongoose schema
│   ├── store.js            # data layer: Mongo or in-memory
│   ├── routes/rooms.js     # REST: list + fetch rooms
│   └── sockets/collab.js   # real-time engine (join/code/presence/autosave)
└── frontend/
    ├── vite.config.js      # dev proxy for /api and /socket.io
    └── src/
        ├── pages/Home.jsx  # create/join rooms, recent rooms
        ├── pages/Room.jsx  # live editor, presence, toasts
        └── lib/            # socket client, api helpers, utils
```

## Real-time protocol (Socket.IO)

| Client to server | Payload | Purpose |
| ---------------- | ------- | ------- |
| `room:join`      | `{ roomId, userName }` (ack: room snapshot) | join a room |
| `room:leave`     | `{ roomId }` | leave before disconnecting |
| `code:change`    | `{ roomId, code }` | broadcast an edit |
| `language:change`| `{ roomId, language }` | switch language |
| `title:change`   | `{ roomId, title }` | rename session |

Server broadcasts: `code:change`, `language:change`, `title:change`, `user:joined`, `user:left`, `presence:update`.

## REST API

| Method | Route | Description |
| ------ | ----- | ----------- |
| GET | `/api/health` | service check |
| GET | `/api/rooms` | 8 most recently active rooms |
| GET | `/api/rooms/:roomId` | one room's saved state |

## Environment variables (backend/.env)

| Variable | Default | Description |
| -------- | ------- | ----------- |
| `PORT` | `5000` | backend port |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/codesync` | MongoDB connection string |

## Troubleshooting

- **Port 5000 or 5173 already in use** - change `PORT` in `backend/.env` (Vite will ask to use the next free port)
- **"MEMORY mode" in the console** - MongoDB is not running; start it or ignore (fine for demos)
- **Node version error** - upgrade to Node 18 or newer

## Uploading to GitHub

See [GITHUB_GUIDE.md](GITHUB_GUIDE.md) in this folder for step-by-step instructions.

## License

MIT - do whatever you like with it.
