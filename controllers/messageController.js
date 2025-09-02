import Message from "../models/Message.js";
import notifier from "node-notifier";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Icon ka path (apna PNG/ICO dalna yaha)
const iconPath = path.resolve("public/assets/iwavedigital.png");

// Send message to multiple receivers
export const sendMessage = async (req, res) => {
  try {
    const { receivers, content } = req.body; // receivers = array of userIds

    if (!Array.isArray(receivers) || receivers.length === 0) {
      return res.status(400).json({ message: "Receivers are required" });
    }

    // Create messages for each receiver
    const messages = await Promise.all(
      receivers.map((receiverId) =>
        Message.create({
          sender: req.user._id,
          receiver: receiverId,
          content,
        })
      )
    );

    // Populate sender & receivers
    const populatedMsgs = await Promise.all(
      messages.map((msg) => msg.populate("receiver sender", "username email"))
    );

    // 🔔 Sender notification (ek baar hi dikhana hai)
    notifier.notify({
      title: "Message Sent",
      message: `Message sent to ${receivers.length} user(s)`,
      sound: true,
      icon: iconPath, // Custom icon
      wait: true, // Allow click events
      appID: "ChatApp",
    });

    // 🔔 Receiver notification (har receiver ke liye alag)
    populatedMsgs.forEach((msg) => {
      notifier.notify(
        {
          title: "💬 New Message",
          message: `From ${msg.sender.username}: ${msg.content}`,
          sound: true,
          icon: iconPath,
          wait: true,
          open: "http://localhost:3000/chat", // Jab click kare to ye URL open ho
        },
        (err, response, metadata) => {
          if (metadata.activationType === "contentsClicked") {
            console.log("Notification clicked!");
          }
        }
      );
    });
    res.status(201).json(populatedMsgs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get my messages (excluding soft-deleted ones)
export const getMyMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
      deletedBy: { $ne: req.user._id },
    }).populate("sender receiver", "username email");

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Soft delete (only receiver can delete from their side)
export const deleteMessageForUser = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (message.receiver.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Only receiver can delete from their side" });
    }

    if (!message.deletedBy.includes(req.user._id)) {
      message.deletedBy.push(req.user._id);
      await message.save();
    }

    res.json({ message: "Message deleted for you" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin: Get all messages
export const getAllMessages = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admin can see all messages" });
    }

    const messages = await Message.find().populate(
      "sender receiver",
      "username email role"
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
