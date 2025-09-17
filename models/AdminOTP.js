import mongoose from "mongoose";

const AdminOTPSchema = new mongoose.Schema({
  identifier: { type: String, required: true },
  otp_hash: { type: String, required: true },
  expires_at: { type: Date, required: true },
  used: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("AdminOTP", AdminOTPSchema);
