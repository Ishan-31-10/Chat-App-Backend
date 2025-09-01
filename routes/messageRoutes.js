import express from "express";
import { protect, adminOnly } from "../middlewares/authMiddleware.js";
import {
  sendMessage,
  getMyMessages,
  deleteMessageForUser,
  getAllMessages
} from "../controllers/messageController.js";

const router = express.Router();

router.post("/send", protect, sendMessage);
router.get("/my", protect, getMyMessages);
router.delete("/:id", protect, deleteMessageForUser);
router.get("/all", protect, adminOnly, getAllMessages);
// Get chat history between two users
router.get("/:userId/:otherUserId", async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: otherUserId },
        { sender: otherUserId, receiver: userId },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
