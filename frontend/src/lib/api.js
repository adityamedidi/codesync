async function jsonFetch(url) {
  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  recentRooms: () => jsonFetch("/api/rooms").then((d) => d.rooms),
  getRoom: (roomId) => jsonFetch(`/api/rooms/${encodeURIComponent(roomId)}`).then((d) => d.room),
};
