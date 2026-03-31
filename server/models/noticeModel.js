import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema(
  {
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true },
    scope: { type: String, enum: ["all", "group", "individual"], required: true },
    group: { type: String, default: "" },
    recipientType: { type: String, default: "" },
    recipientIds: [{ type: String }],
    totalRecipients: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    createdBy: { type: String, default: "admin" },
  },
  { timestamps: true }
);

export default mongoose.model("Notice", noticeSchema);
