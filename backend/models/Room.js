import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    roomId: { type: String, required: true, unique: true, index: true },
    title: { type: String, default: "Untitled session", maxlength: 120 },
    language: { type: String, default: "javascript" },
    code: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Room", roomSchema);
