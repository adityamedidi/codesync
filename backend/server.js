import express from "express";
import http from "http";
import fs from "fs";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import roomsRouter from "./routes/rooms.js";
import { registerCollabSockets } from "./sockets/collab.js";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] },
  maxHttpBufferSize: 1e6,
});

app.use(cors());
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "codesync-api" });
});

app.use("/api/rooms", roomsRouter);

// In production, serve the built React frontend from the same server.
const dist = path.join(__dirname, "..", "frontend", "dist");
app.use(express.static(dist));
app.use((req, res, next) => {
  const isApi = req.path.startsWith("/api") || req.path.startsWith("/socket.io");
  if (req.method === "GET" && !isApi && fs.existsSync(path.join(dist, "index.html"))) {
    return res.sendFile(path.join(dist, "index.html"));
  }
  next();
});

// Central error handler -> always JSON
app.use((err, req, res, next) => {
  const status = err.status || 500;
  if (status >= 500) console.error("[codesync]", err);
  res.status(status).json({ error: err.message || "Something went wrong" });
});

registerCollabSockets(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`[codesync] API + real-time engine listening on http://localhost:${PORT}`);
});

// Connect to MongoDB in the background; if unavailable the app keeps
// working with an in-memory store (see store.js).
connectDB().catch(() => {});
