const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { nanoid } = require('nanoid');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// In-memory storage for active users and sessions
// In a production app, this would be stored in a database
const activeUsers = new Map();
const chatSessions = new Map();
const messages = new Map();

// Socket.IO connection handler
io.on("connection", (socket) => {
  const userId = socket.handshake.auth.userId;

  if (!userId) {
    console.log("Connection rejected - no userId provided");
    socket.disconnect(true);
    return;
  }

  console.log(`User connected: ${userId}, Socket ID: ${socket.id}`);

  // Register user as online
  activeUsers.set(userId, { socketId: socket.id, status: 'online' });

  // Send online status to relevant users
  io.emit("userStatusChange", { userId, status: "online" });

  // Handle join chat room
  socket.on("joinRoom", ({ roomId }) => {
    console.log(`User ${userId} joined room ${roomId}`);
    socket.join(roomId);

    // Get room's message history
    const roomMessages = Array.from(messages.values())
      .filter(msg => msg.sessionId === roomId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // Send message history to the user
    socket.emit("messageHistory", { messages: roomMessages });
  });

  // Handle leave chat room
  socket.on("leaveRoom", ({ roomId }) => {
    console.log(`User ${userId} left room ${roomId}`);
    socket.leave(roomId);
  });

  // Handle new messages
  socket.on("sendMessage", (message) => {
    // Generate message ID
    const messageId = nanoid();
    const finalMessage = {
      ...message,
      id: messageId,
      timestamp: new Date(),
      status: "sent"
    };

    // Store message
    messages.set(messageId, finalMessage);

    // Send to the room
    if (message.sessionId) {
      io.to(message.sessionId).emit("newMessage", finalMessage);
    } else {
      // Direct message to a specific user
      const receiverSocket = activeUsers.get(message.receiverId);
      if (receiverSocket) {
        io.to(receiverSocket.socketId).emit("newMessage", finalMessage);
      }
      // Also send to sender for confirmation
      socket.emit("newMessage", finalMessage);
    }

    // Update message status to delivered
    finalMessage.status = "delivered";
    messages.set(messageId, finalMessage);
    socket.emit("messageStatus", { messageId, status: "delivered" });
  });

  // Handle typing events
  socket.on("typing", ({ sessionId, userId, isTyping }) => {
    socket.to(sessionId).emit("typingStatus", { userId, sessionId, isTyping });
  });

  // Handle message read receipts
  socket.on("markAsRead", ({ messageId, userId }) => {
    if (messages.has(messageId)) {
      const message = messages.get(messageId);
      message.status = "read";
      messages.set(messageId, message);

      // Notify the sender
      const senderSocket = activeUsers.get(message.senderId);
      if (senderSocket) {
        io.to(senderSocket.socketId).emit("messageRead", { messageId, userId });
      }
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${userId}`);
    activeUsers.delete(userId);
    io.emit("userStatusChange", { userId, status: "offline" });
  });
});

// API endpoints for message management
app.get('/api/messages/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const sessionMessages = Array.from(messages.values())
    .filter(msg => msg.sessionId === sessionId)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  res.json({ messages: sessionMessages });
});

app.get('/api/users/active', (req, res) => {
  const activeUsersList = Array.from(activeUsers.entries()).map(([userId, data]) => ({
    userId,
    status: data.status
  }));

  res.json({ users: activeUsersList });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});

// Export for potential integration with Next.js API routes
module.exports = { app, server, io };
