import express from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

dotenv.config();
connectDB();

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "https://chat-app-frontend.onrender.com"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "https://chat-app-frontend.onrender.com"],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

app.get("/", (req, res) => {
  res.send("Chat App API running...");
});

// ---------------- SOCKET.IO LOGIC ----------------
let onlineUsers = {};

io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);

  socket.on("register", (userId) => {
    onlineUsers[userId] = socket.id;
    console.log(`${userId} registered with socket ${socket.id}`);
  });

  socket.on("sendMessage", ({ senderId, receivers, message }) => {
    socket.emit("messageStatus", { status: "sent", to: receivers, message });

    receivers.forEach((receiverId) => {
      if (onlineUsers[receiverId]) {
        io.to(onlineUsers[receiverId]).emit("newMessage", {
          from: senderId,
          message,
        });
      }
    });
  });

  socket.on("messageSeen", ({ messageId, receiverId, senderId }) => {
    if (onlineUsers[senderId]) {
      io.to(onlineUsers[senderId]).emit("messageSeenUpdate", {
        messageId,
        seenBy: receiverId,
      });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    for (let userId in onlineUsers) {
      if (onlineUsers[userId] === socket.id) {
        delete onlineUsers[userId];
      }
    }
  });
});

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
