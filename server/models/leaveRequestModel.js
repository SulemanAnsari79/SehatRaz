import mongoose from "mongoose";

const leaveRequestSchema = new mongoose.Schema(
  {
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    date: { type: String, required: true, trim: true },
    reason: { type: String, required: true, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    adminNote: { type: String, default: "", trim: true, maxlength: 1000 },
    reviewedBy: { type: String, default: "" },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

leaveRequestSchema.index({ doctor: 1, date: 1, status: 1 });

export default mongoose.model("LeaveRequest", leaveRequestSchema);
