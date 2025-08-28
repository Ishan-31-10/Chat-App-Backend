import express from "express";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";

dotenv.config();
connectDB();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  },
});

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

app.get("/", (req, res) => {
  res.send("Chat App API running...");
});

// ---------------- SOCKET.IO LOGIC ----------------
let onlineUsers = {}; // { userId: socketId }

io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);

  // User register kar raha hai apna ID
  socket.on("register", (userId) => {
    onlineUsers[userId] = socket.id;
    console.log(`${userId} registered with socket ${socket.id}`);
  });

  // Message bhejna
  socket.on("sendMessage", ({ senderId, receivers, message }) => {
    console.log(`${senderId} -> ${receivers}: ${message}`);

    // sender ko confirmation
    socket.emit("messageStatus", {
      status: "sent",
      to: receivers,
      message,
    });

    // sabhi receivers ko bhejo
    receivers.forEach((receiverId) => {
      if (onlineUsers[receiverId]) {
        io.to(onlineUsers[receiverId]).emit("newMessage", {
          from: senderId,
          message,
        });
      }
    });
  });

  // Seen event
  socket.on("messageSeen", ({ messageId, receiverId, senderId }) => {
    console.log(`👀 Message ${messageId} seen by ${receiverId}`);
    if (onlineUsers[senderId]) {
      io.to(onlineUsers[senderId]).emit("messageSeenUpdate", {
        messageId,
        seenBy: receiverId,
      });
    }
  });

  // Disconnect
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
