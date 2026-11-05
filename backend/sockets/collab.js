// Real-time collaboration engine (Socket.IO).
// Events:
//   client -> server : room:join, room:leave, code:change, language:change, title:change
//   server -> client : code:change, language:change, title:change,
//                      user:joined, user:left, presence:update
import { getRoom, touchRoom, upsertRoom } from "../store.js";

const LANG_IDS = ["javascript", "python", "html", "css", "plaintext"];
const MAX_CODE_LENGTH = 200_000;
const SAVE_DEBOUNCE_MS = 800;

// roomId -> { code, language, title } : the live state of each active room
const live = new Map();
const saveTimers = new Map();

export function registerCollabSockets(io) {
  io.on("connection", (socket) => {
    socket.data.userName = "Guest";
    let currentRoom = null;

    socket.on("room:join", async (payload = {}, callback = () => {}) => {
      try {
        const id = String(payload.roomId || "").slice(0, 64);
        if (!id) return callback({ ok: false, error: "Invalid room id" });

        currentRoom = id;
        socket.data.userName = String(payload.userName || "Guest").trim().slice(0, 24) || "Guest";
        socket.join(id);

        const existing = await getRoom(id);
        if (!live.has(id)) {
          live.set(id, {
            code: existing?.code ?? "",
            language: LANG_IDS.includes(existing?.language) ? existing.language : "javascript",
            title: existing?.title ?? "Untitled session",
          });
        }
        const state = live.get(id);

        await touchRoom(id, state);
        callback({ ok: true, room: { roomId: id, ...state }, you: socket.id });

        socket.to(id).emit("user:joined", { id: socket.id, userName: socket.data.userName });
        await broadcastPresence(io, id);
      } catch (err) {
        callback({ ok: false, error: "Could not join room" });
      }
    });

    socket.on("room:leave", async () => {
      if (!currentRoom) return;
      const room = currentRoom;
      currentRoom = null;
      socket.leave(room);
      socket.to(room).emit("user:left", { id: socket.id, userName: socket.data.userName });
      await broadcastPresence(io, room);
      await flushIfEmpty(io, room);
    });

    socket.on("code:change", ({ code } = {}) => {
      if (!currentRoom || typeof code !== "string") return;
      const state = live.get(currentRoom);
      if (!state) return;
      state.code = code.slice(0, MAX_CODE_LENGTH);
      scheduleSave(currentRoom);
      socket.to(currentRoom).emit("code:change", { code: state.code, from: socket.id });
    });

    socket.on("language:change", ({ language } = {}) => {
      if (!currentRoom || !LANG_IDS.includes(language)) return;
      const state = live.get(currentRoom);
      if (!state) return;
      state.language = language;
      scheduleSave(currentRoom);
      io.to(currentRoom).emit("language:change", { language, from: socket.id });
    });

    socket.on("title:change", ({ title } = {}) => {
      if (!currentRoom) return;
      const state = live.get(currentRoom);
      if (!state) return;
      state.title = String(title ?? "").slice(0, 120) || "Untitled session";
      scheduleSave(currentRoom);
      socket.to(currentRoom).emit("title:change", { title: state.title, from: socket.id });
    });

    socket.on("disconnecting", async () => {
      const room = currentRoom;
      if (!room) return;
      socket.to(room).emit("user:left", { id: socket.id, userName: socket.data.userName });
      await broadcastPresence(io, room);
      await flushIfEmpty(io, room);
    });
  });

  console.log("[codesync] Socket.IO collaboration engine ready");
}

async function broadcastPresence(io, roomId) {
  try {
    const sockets = await io.in(roomId).fetchSockets();
    const users = sockets.map((s) => ({ id: s.id, userName: s.data.userName || "Guest" }));
    io.to(roomId).emit("presence:update", { users });
  } catch {
    /* presence is best-effort */
  }
}

function scheduleSave(roomId) {
  clearTimeout(saveTimers.get(roomId));
  saveTimers.set(roomId, setTimeout(() => {
    saveTimers.delete(roomId);
    flushSave(roomId);
  }, SAVE_DEBOUNCE_MS));
}

async function flushIfEmpty(io, roomId) {
  try {
    const sockets = await io.in(roomId).fetchSockets();
    if (sockets.length === 0) flushSave(roomId);
  } catch {
    flushSave(roomId);
  }
}

async function flushSave(roomId) {
  const state = live.get(roomId);
  if (!state) return;
  try {
    await upsertRoom({ roomId, ...state });
  } catch (err) {
    console.warn("[codesync] Autosave failed:", err.message);
  }
}
