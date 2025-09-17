import mongoose from "mongoose";

const CampaignSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String },
  team_id: { type: String },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["draft","scheduled","sent"], default: "draft" },
  scheduled_at: { type: Date, default: null }
}, { timestamps: true });

export default mongoose.model("Campaign", CampaignSchema);
