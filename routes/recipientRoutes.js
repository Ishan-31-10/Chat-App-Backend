import express from "express";
import CampaignRecipient from "../models/CampaignRecipient.js";
import Notification from "../models/Notification.js";
import ActionLog from "../models/ActionLog.js";
import pkg from "bull";
const { Queue } = pkg;
import { DateTime } from "luxon";

const router = express.Router();

// Recipient action via notification id
router.post("/notifications/:id/action", async (req, res) => {
  try {
    const nid = req.params.id;
    const { action, reason, hold_hours, source_name, actor_id } = req.body;
    const notif = await Notification.findById(nid);
    if (!notif) return res.status(404).json({ msg: "notification not found" });
    const rec = await CampaignRecipient.findById(notif.campaign_recipient_id);
    if (!rec) return res.status(404).json({ msg: "recipient not found" });
    // update recipient status
    rec.status = action;
    rec.last_action_at = new Date();
    if (action === "hold" && hold_hours) {
      const holdUntil = new Date(Date.now() + (parseInt(hold_hours,10) * 3600 * 1000));
      rec.hold_until = holdUntil;
    } else {
      rec.hold_until = null;
    }
    await rec.save();
    // action log
    const log = new ActionLog({ campaign_recipient_id: rec._id, action, actor_id, reason, hold_until: rec.hold_until, source_name });
    await log.save();
    // emit or further processing: if accept, enqueue downstream job (example)
    if (action === "accept") {
      const sendQueue = new Bull(process.env.REDIS_URL || "redis://127.0.0.1:6379");
      await sendQueue.add("post_accept_workflow", { recipient_id: rec._id });
    }
    return res.json({ msg: "ok" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "server error" });
  }
});

export default router;
