import { io } from "socket.io-client";

// Same-origin connection: in dev, Vite proxies /socket.io to the backend;
// in production, the Express server serves the built app.
export const socket = io("/", { autoConnect: false });

export function connectSocket() {
  if (!socket.connected && !socket.connecting) socket.connect();
}
