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

export default router;
