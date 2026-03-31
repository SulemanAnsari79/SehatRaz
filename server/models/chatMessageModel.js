import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true, index: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: "OnlineSession", required: true, index: true },
    senderRole: { type: String, enum: ["doctor", "user", "system"], required: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    senderName: { type: String, default: "" },
    messageType: { type: String, enum: ["text", "system"], default: "text" },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    sentAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

chatMessageSchema.index({ appointment: 1, sentAt: -1 });
chatMessageSchema.index({ session: 1, sentAt: -1 });

export default mongoose.model("ChatMessage", chatMessageSchema);
