import mongoose from "mongoose";

const CampaignRecipientSchema = new mongoose.Schema({
  campaign_id: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign", required: true },
  name: { type: String },
  email: { type: String },
  phone: { type: String },
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  status: { type: String, enum: ["pending","sent","delivered","failed","accepted","rejected","on_hold"], default: "pending" },
  last_action_at: { type: Date, default: null },
  hold_until: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model("CampaignRecipient", CampaignRecipientSchema);
