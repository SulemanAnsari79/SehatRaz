import mongoose from "mongoose";

const onlineSessionSchema = new mongoose.Schema(
  {
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true, unique: true },
    roomId: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: ["scheduled", "live", "ended", "expired"],
      default: "scheduled",
    },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    endedBy: { type: String, enum: ["doctor", "user", "system", ""], default: "" },
    lastActivityAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("OnlineSession", onlineSessionSchema);
