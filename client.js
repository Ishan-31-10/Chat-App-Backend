import { io } from "socket.io-client";

const socket = io("http://localhost:5000", { transports: ["websocket"] });

const senderId = "user123";

socket.on("connect", () => {
  console.log("✅ Sender connected:", socket.id);
  socket.emit("register", senderId);

  // Thoda delay ke baad message bhejna
  setTimeout(() => {
    socket.emit("sendMessage", {
      senderId,
      receivers: ["user456"],
      message: "Hello from user123 🚀",
    });
  }, 2000);
});

socket.on("messageStatus", (data) => {
  console.log("📤 Message Status:", data);
});

socket.on("messageSeenUpdate", (data) => {
  console.log("👀 Seen update:", data);
});
