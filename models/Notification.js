import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  campaign_recipient_id: { type: mongoose.Schema.Types.ObjectId, ref: "CampaignRecipient", required: true },
  campaign_id: { type: mongoose.Schema.Types.ObjectId, ref: "Campaign" },
  payload: { type: Object, default: {} },
  status: { type: String, enum: ["queued","sent","delivered","read","failed"], default: "queued" },
  delivery_channel: { type: String, enum: ["email","push","sms"], default: "email" },
  delivered_at: { type: Date },
  read_at: { type: Date },
  source_name: { type: String }
}, { timestamps: true });

export default mongoose.model("Notification", NotificationSchema);
