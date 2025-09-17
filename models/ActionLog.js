import mongoose from "mongoose";

const ActionLogSchema = new mongoose.Schema({
  campaign_recipient_id: { type: mongoose.Schema.Types.ObjectId, ref: "CampaignRecipient", required: true },
  action: { type: String, enum: ["accept","reject","hold"], required: true },
  actor_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  actor_role: { type: String },
  reason: { type: String },
  hold_until: { type: Date },
  source_name: { type: String },
  meta_data: { type: Object, default: {} }
}, { timestamps: true });

export default mongoose.model("ActionLog", ActionLogSchema);
