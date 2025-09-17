import express from "express";
import Campaign from "../models/Campaign.js";
import Notification from "../models/Notification.js";
import AdminOTP from "../models/AdminOTP.js";
import User from "../models/User.js";
import crypto from "crypto";
import bcrypt from "bcryptjs";

const router = express.Router();

// list campaigns (admin)
router.get("/campaigns", async (req, res) => {
  const campaigns = await Campaign.find().lean();
  return res.json({ total: campaigns.length, items: campaigns });
});

// list notifications
router.get("/notifications", async (req, res) => {
  const q = await Notification.find().sort({ createdAt: -1 }).limit(200).lean();
  return res.json({ total: q.length, items: q });
});

// request otp (dev prints otp)
router.post("/request-otp", async (req, res) => {
  const { identifier } = req.body;
  if (!identifier) return res.status(400).json({ msg: "identifier required" });
  const otp = (Math.floor(100000 + Math.random() * 900000)).toString();
  const hash = crypto.createHash("sha256").update(process.env.SECRET_KEY + otp).digest("hex");
  const expires_at = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRY || "600") * 1000));
  const rec = new AdminOTP({ identifier, otp_hash: hash, expires_at });
  await rec.save();
  console.log("[DEV OTP]", identifier, otp);
  return res.json({ msg: "otp_sent", expires_at });
});

// verify otp
router.post("/verify-otp", async (req, res) => {
  const { identifier, otp } = req.body;
  if (!identifier || !otp) return res.status(400).json({ msg: "identifier and otp required" });
  const rec = await AdminOTP.findOne({ identifier, used: false }).sort({ createdAt: -1 });
  if (!rec) return res.status(404).json({ msg: "no pending otp" });
  if (rec.expires_at < new Date()) return res.status(400).json({ msg: "otp expired" });
  const hash = crypto.createHash("sha256").update(process.env.SECRET_KEY + otp).digest("hex");
  if (hash !== rec.otp_hash) return res.status(400).json({ msg: "invalid otp" });
  rec.used = true;
  await rec.save();
  // find or create admin user
  let user = await User.findOne({ email: identifier });
  if (!user) {
    user = new User({ email: identifier, username: identifier.split("@")[0], password: "changeme", role: "admin" });
    await user.save();
  } else {
    if (user.role !== "admin") {
      user.role = "admin";
      await user.save();
    }
  }
  // naive token: in your system use JWT; here we return user info
  return res.json({ msg: "ok", user: { id: user._id, email: user.email, role: user.role } });
});

export default router;
