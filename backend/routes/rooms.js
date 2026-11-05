import { Router } from "express";
import { getRoom, listRecentRooms } from "../store.js";

const router = Router();

// GET /api/rooms - most recently active rooms (for the home page)
router.get("/", async (req, res, next) => {
  try {
    res.json({ rooms: await listRecentRooms(8) });
  } catch (err) {
    next(err);
  }
});

// GET /api/rooms/:roomId - fetch a single room's latest saved state
router.get("/:roomId", async (req, res, next) => {
  try {
    const room = await getRoom(req.params.roomId);
    if (!room) return res.status(404).json({ error: "Room not found" });
    res.json({ room });
  } catch (err) {
    next(err);
  }
});

export default router;
