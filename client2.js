const io = require("socket.io-client");
const socket = io("http://localhost:5000");

// Apni userId set karo
const userId = "ishan"; 

socket.on("connect", () => {
  console.log("Receiver connected:", socket.id);

  // server ko batado ki kaunsa user hu
  socket.emit("register", userId);
});

// Jab message aaye
socket.on("receiveMessage", (data) => {
  console.log(`📩 New message from ${data.from}: ${data.message}`);

  // yaha notification logic lagana hai (backend ya frontend pe)
  console.log("🔔 Notification: You have a new message!");

  // Seen event bhejna
  socket.emit("messageSeen", {
    from: data.from,
    to: userId,
    messageId: Date.now().toString() // abhi ke liye dummy id
  });
});

// Jab confirmation aaye ki message seen ho gaya
socket.on("messageSeenConfirmation", (data) => {
  console.log(`✅ Your message was seen by ${data.to}`);
});
