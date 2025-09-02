// controllers/messageController.js
import Message from "../models/Message.js";
import notifier from "node-notifier";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Safe icon path (optional). If it doesn't exist, notifications still work locally.
const iconPath = path.resolve("public/assets/iwavedigital.png");
const isProd = process.env.NODE_ENV === "production";

/**
 * POST /api/messages/send
 * body: { receivers: [userId], content: string }
 */
export const sendMessage = async (req, res) => {
  try {
    const { receivers, content } = req.body;

    if (!Array.isArray(receivers) || receivers.length === 0) {
      return res.status(400).json({ message: "Receivers are required" });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Content is required" });
    }

    // Create individual docs – keeps analytics/admin views simple
    const docs = await Promise.all(
      receivers.map((receiverId) =>
        Message.create({
          sender: req.user._id,
          receiver: receiverId,
          content: content.trim(),
        })
      )
    );

    const populated = await Message.find({
      _id: { $in: docs.map((d) => d._id) },
    })
      .populate("sender receiver", "username email")
      .sort({ createdAt: 1 });

    // Local desktop notifications (skip in production/Render)
    if (!isProd) {
      try {
        notifier.notify({
          title: "Message Sent",
          message: `Message sent to ${receivers.length} user(s)`,
          sound: true,
          icon: iconPath,
          wait: false,
          appID: "ChatApp",
        });

        populated.forEach((msg) => {
          notifier.notify({
            title: "💬 New Message",
            message: `From ${msg.sender.username || msg.sender.email}: ${msg.content}`,
            sound: true,
            icon: iconPath,
            wait: false,
            // open: "http://localhost:3000/chat",
          });
        });
      } catch (_) {
        // ignore notifier errors on unsupported envs
      }
    }

    // Return a clean shape
    res.status(201).json(
      populated.map((m) => ({
        _id: m._id,
        content: m.content,
        createdAt: m.createdAt,
        sender: { _id: m.sender._id, username: m.sender.username, email: m.sender.email },
        receiver: { _id: m.receiver._id, username: m.receiver.username, email: m.receiver.email },
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/messages/my
 * Get all messages involving me (not soft-deleted)
 */
export const getMyMessages = async (req, res) => {
  try {
    const me = req.user._id;

    const messages = await Message.find({
      $or: [{ sender: me }, { receiver: me }],
      deletedBy: { $ne: me },
    })
      .populate("sender receiver", "username email")
      .sort({ createdAt: 1 });

    res.json(
      messages.map((m) => ({
        _id: m._id,
        content: m.content,
        createdAt: m.createdAt,
        sender: { _id: m.sender._id, username: m.sender.username, email: m.sender.email },
        receiver: { _id: m.receiver._id, username: m.receiver.username, email: m.receiver.email },
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/messages/conversation/:otherUserId
 * Get 1-to-1 thread between me and someone else
 */
export const getConversation = async (req, res) => {
  try {
    const me = req.user._id;
    const { otherUserId } = req.params;

    const messages = await Message.find({
      $or: [
        { sender: me, receiver: otherUserId },
        { sender: otherUserId, receiver: me },
      ],
      deletedBy: { $ne: me },
    })
      .populate("sender receiver", "username email")
      .sort({ createdAt: 1 });

    res.json(
      messages.map((m) => ({
        _id: m._id,
        content: m.content,
        createdAt: m.createdAt,
        sender: { _id: m.sender._id, username: m.sender.username, email: m.sender.email },
        receiver: { _id: m.receiver._id, username: m.receiver.username, email: m.receiver.email },
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * DELETE /api/messages/:id   (soft delete for receiver)
 */
export const deleteMessageForUser = async (req, res) => {
  try {
    const me = req.user._id;
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (message.receiver.toString() !== me.toString()) {
      return res.status(403).json({ message: "Only receiver can delete from their side" });
    }

    const alreadyDeleted = message.deletedBy.some(
      (id) => id.toString() === me.toString()
    );

    if (!alreadyDeleted) {
      message.deletedBy.push(me);
      await message.save();
    }

    res.json({ message: "Message deleted for you" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/messages/all  (admin only)
 */
export const getAllMessages = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can see all messages" });
    }

    const messages = await Message.find()
      .populate("sender receiver", "username email role")
      .sort({ createdAt: 1 });

    res.json(
      messages.map((m) => ({
        _id: m._id,
        content: m.content,
        createdAt: m.createdAt,
        sender: { _id: m.sender._id, username: m.sender.username, email: m.sender.email, role: m.sender.role },
        receiver: { _id: m.receiver._id, username: m.receiver.username, email: m.receiver.email, role: m.receiver.role },
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
