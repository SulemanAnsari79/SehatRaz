import mongoose from "mongoose";

const deliveryLocationRuleSchema = new mongoose.Schema(
  {
    singletonKey: { type: String, default: "global", unique: true },
    isEnabled: { type: Boolean, default: false },
    allowedCities: [{ type: String, trim: true }],
    allowedStates: [{ type: String, trim: true }],
    allowedCountries: [{ type: String, trim: true }],
    allowedPincodes: [{ type: String, trim: true }],
  },
  { timestamps: true }
);

export default mongoose.model("DeliveryLocationRule", deliveryLocationRuleSchema);