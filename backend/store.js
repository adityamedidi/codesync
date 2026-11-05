// Data access layer for rooms.
// Uses MongoDB (mongoose) when a connection is available, and transparently
// falls back to an in-memory Map so the app always works out of the box.
import { isDbConnected } from "./config/db.js";
import Room from "./models/Room.js";

const mem = new Map(); // roomId -> room document

export async function getRoom(roomId) {
  if (isDbConnected()) {
    const doc = await Room.findOne({ roomId }).lean();
    return doc ? toPublic(doc) : null;
  }
  return mem.has(roomId) ? toPublic(mem.get(roomId)) : null;
}

// Called on every join - creates the room if missing and refreshes metadata
// without clobbering the saved code.
export async function touchRoom(roomId, state) {
  if (isDbConnected()) {
    await Room.updateOne(
      { roomId },
      {
        $set: { title: state.title, language: state.language, updatedAt: new Date() },
        $setOnInsert: { code: state.code || "" },
      },
      { upsert: true }
    );
    return;
  }
  const existing = mem.get(roomId);
  if (existing) {
    existing.title = state.title;
    existing.language = state.language;
    existing.updatedAt = new Date();
  } else {
    mem.set(roomId, {
      roomId,
      title: state.title,
      language: state.language,
      code: state.code || "",
      updatedAt: new Date(),
      createdAt: new Date(),
    });
  }
}

// Persist the latest editor state (called from debounced save timers).
export async function upsertRoom({ roomId, title, language, code }) {
  if (isDbConnected()) {
    await Room.updateOne(
      { roomId },
      { $set: { title, language, code, updatedAt: new Date() } },
      { upsert: true }
    );
    return;
  }
  const existing = mem.get(roomId) || {};
  mem.set(roomId, {
    roomId,
    title,
    language,
    code,
    createdAt: existing.createdAt || new Date(),
    updatedAt: new Date(),
  });
}

export async function listRecentRooms(limit = 8) {
  if (isDbConnected()) {
    const docs = await Room.find({}, { roomId: 1, title: 1, language: 1, updatedAt: 1 })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();
    return docs.map(({ roomId, title, language, updatedAt }) => ({
      roomId,
      title,
      language,
      updatedAt,
    }));
  }
  return [...mem.values()]
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
    .slice(0, limit)
    .map(({ roomId, title, language, updatedAt }) => ({ roomId, title, language, updatedAt }));
}

function toPublic(doc) {
  return {
    roomId: doc.roomId,
    title: doc.title,
    language: doc.language,
    code: doc.code,
    updatedAt: doc.updatedAt || new Date(),
  };
}
