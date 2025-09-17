// Simple worker using Bull to process send_campaign and send_notification
import pkg from "bull";
const { Queue } = pkg;
import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "../config/db.js";
import Campaign from "../models/Campaign.js";
import CampaignRecipient from "../models/CampaignRecipient.js";
import Notification from "../models/Notification.js";

dotenv.config();
connectDB();

const sendQueue = new Bull(process.env.REDIS_URL || "redis://127.0.0.1:6379", { redis: { maxRetriesPerRequest: null } });

sendQueue.process("send_campaign", async (job) => {
  const { campaign_id } = job.data;
  console.log("[worker] processing send_campaign", campaign_id);
  const recipients = await CampaignRecipient.find({ campaign_id });
  for (const r of recipients) {
    // create notification record
    const notif = new Notification({ campaign_recipient_id: r._id, campaign_id, payload: { title: 'Campaign', message: 'Please respond' }, status: 'queued', delivery_channel: 'email' });
    await notif.save();
    // enqueue send_notification job
    await sendQueue.add("send_notification", { notification_id: notif._id });
  }
  await Campaign.findByIdAndUpdate(campaign_id, { status: "sent" });
  return Promise.resolve();
});

sendQueue.process("send_notification", async (job) => {
  const { notification_id } = job.data;
  console.log("[worker] processing send_notification", notification_id);
  const notif = await Notification.findById(notification_id);
  if (!notif) return;
  // simulate delivery: mark sent and update recipient
  notif.status = "sent";
  notif.delivered_at = new Date();
  await notif.save();
  await CampaignRecipient.findByIdAndUpdate(notif.campaign_recipient_id, { status: "sent" });
  return Promise.resolve();
});

console.log("Worker started, listening for jobs...");
