import Room from "../models/Room.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import {
  addUserSocket,
  removeUserSocket,
  isUserOnline,
  getOnlineUsers,
} from "./presence.js";
import { socketAuthMiddleware } from "./auth.socket.js";

export const initSocket = (io) => {
  // Verify JWT before any socket connects
  io.use(socketAuthMiddleware);

  io.on("connection", async (socket) => {
    const user = socket.user;
    const userId = user._id.toString();

    console.log(`Socket connected: ${user.name} (${socket.id})`);

    // --- Presence: mark user online ---
    addUserSocket(userId, socket.id);

    // Tell everyone this user is now online
    socket.broadcast.emit("user_online", {
      userId,
      name: user.name,
      avatarUrl: user.avatarUrl,
    });

    // Send the new connection the full list of currently online users
    socket.emit("online_users", getOnlineUsers());

    // --- join_room ---
    socket.on("join_room", async ({ roomId }) => {
      try {
        const room = await Room.findById(roomId);
        if (!room) return socket.emit("error", { message: "Room not found" });

        // DM: only participants can join
        if (room.type === "dm") {
          const isMember = room.participants.some(
            (p) => p.toString() === userId
          );
          if (!isMember) {
            return socket.emit("error", { message: "Not authorized" });
          }
        }

        socket.join(roomId);
        socket.emit("room_joined", { roomId });
        console.log(`${user.name} joined room ${roomId}`);
      } catch (err) {
        socket.emit("error", { message: "Could not join room" });
      }
    });

    // --- leave_room ---
    socket.on("leave_room", ({ roomId }) => {
      socket.leave(roomId);
      console.log(`${user.name} left room ${roomId}`);
    });

    // --- send_message ---
    socket.on("send_message", async ({ roomId, content }) => {
      try {
        if (!content || !content.trim()) {
          return socket.emit("error", { message: "Message cannot be empty" });
        }

        if (content.length > 1000) {
          return socket.emit("error", {
            message: "Message cannot exceed 1000 characters",
          });
        }

        const room = await Room.findById(roomId);
        if (!room) {
          return socket.emit("error", { message: "Room not found" });
        }

        // DM: only participants can send
        if (room.type === "dm") {
          const isMember = room.participants.some(
            (p) => p.toString() === userId
          );
          if (!isMember) {
            return socket.emit("error", { message: "Not authorized" });
          }
        }

        // Save message to DB
        const message = await Message.create({
          room: roomId,
          sender: user._id,
          content: content.trim(),
        });

        // Update room's lastMessage
        await Room.findByIdAndUpdate(roomId, { lastMessage: message._id });

        // Populate sender info before broadcasting
        await message.populate("sender", "name avatarUrl");

        // Broadcast to everyone in the room (including sender)
        io.to(roomId).emit("receive_message", {
          _id: message._id,
          room: roomId,
          sender: {
            _id: user._id,
            name: user.name,
            avatarUrl: user.avatarUrl,
          },
          content: message.content,
          createdAt: message.createdAt,
        });
      } catch (err) {
        socket.emit("error", { message: "Could not send message" });
      }
    });

    // --- typing ---
    socket.on("typing", ({ roomId }) => {
      // Broadcast to everyone in the room EXCEPT the sender
      socket.to(roomId).emit("typing", {
        userId,
        name: user.name,
        roomId,
      });
    });

    // --- stop_typing ---
    socket.on("stop_typing", ({ roomId }) => {
      socket.to(roomId).emit("stop_typing", {
        userId,
        roomId,
      });
    });

    // --- disconnect ---
    socket.on("disconnect", async () => {
      console.log(`Socket disconnected: ${user.name} (${socket.id})`);

      const isFullyOffline = removeUserSocket(userId, socket.id);

      if (isFullyOffline) {
        // Update lastSeen in DB
        await User.findByIdAndUpdate(userId, { lastSeen: new Date() });

        // Tell everyone this user is now offline
        io.emit("user_offline", { userId });

        console.log(`${user.name} is now fully offline`);
      }
    });
  });
};