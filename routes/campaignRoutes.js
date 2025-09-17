import express from "express";
import Campaign from "../models/Campaign.js";
import CampaignRecipient from "../models/CampaignRecipient.js";
import Notification from "../models/Notification.js";
import pkg from "bull";
const { Queue } = pkg;
import mongoose from "mongoose";

const router = express.Router();

// Create campaign
router.post("/", async (req, res) => {
  try {
    const { title, message, team_id, created_by, scheduled_at } = req.body;
    if (!title) return res.status(400).json({ msg: "title required" });
    const c = new Campaign({ title, message, team_id, created_by, scheduled_at });
    await c.save();
    return res.status(201).json({ msg: "created", id: c._id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "server error" });
  }
});

// Add recipients (array)
router.post("/:id/recipients", async (req, res) => {
  try {
    const { id } = req.params;
    const arr = req.body.recipients || [];
    const created = [];
    for (const r of arr) {
      const rec = new CampaignRecipient({ campaign_id: id, name: r.name, email: r.email, phone: r.phone, user_id: r.user_id || null });
      await rec.save();
      created.push(rec);
    }
    return res.status(201).json({ msg: "recipients added", recipients: created });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "server error" });
  }
});

// Enqueue send campaign
router.post("/:id/send", async (req, res) => {
  try {
    const { id } = req.params;
    const sendQueue = new Bull(process.env.REDIS_URL || "redis://127.0.0.1:6379", { redis: { maxRetriesPerRequest: null } });
    await sendQueue.add("send_campaign", { campaign_id: id });
    // update campaign status
    await Campaign.findByIdAndUpdate(id, { status: "scheduled" });
    return res.json({ status: "scheduled" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "server error" });
  }
});

// Get campaign with recipients
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await Campaign.findById(id).lean();
    if (!campaign) return res.status(404).json({ msg: "not found" });
    const recipients = await CampaignRecipient.find({ campaign_id: id }).lean();
    campaign.recipients = recipients;
    return res.json(campaign);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "server error" });
  }
});

export default router;
