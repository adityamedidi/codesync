import mongoose from "mongoose";

export async function connectDB() {
  const uri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/codesync";
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 4000 });
    console.log(`[codesync] MongoDB connected (db: ${mongoose.connection.name})`);
    return true;
  } catch {
    console.warn("[codesync] MongoDB not reachable - running in MEMORY mode.");
    console.warn("[codesync] Rooms will reset on restart. To persist data, start MongoDB");
    console.warn("[codesync] and set MONGO_URI in backend/.env (see .env.example).");
    return false;
  }
}

export const isDbConnected = () => mongoose.connection.readyState === 1;
