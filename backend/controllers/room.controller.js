import asyncHandler from "express-async-handler";
import { validationResult } from "express-validator";
import Room from "../models/Room.js";
import Message from "../models/Message.js";
import User from "../models/User.js";

// GET /api/rooms — list all public rooms
export const getRooms = asyncHandler(async (req, res) => {
  const rooms = await Room.find({ type: "room" })
    .populate("createdBy", "name avatarUrl")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    message: "Rooms fetched successfully",
    data: { rooms },
  });
});

// POST /api/rooms — create a public room
export const createRoom = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const { name } = req.body;

  const existingRoom = await Room.findOne({
    name: { $regex: new RegExp(`^${name}$`, "i") },
    type: "room",
  });

  if (existingRoom) {
    res.status(400);
    throw new Error("A room with this name already exists");
  }

  const room = await Room.create({
    name,
    type: "room",
    participants: [req.user._id],
    createdBy: req.user._id,
  });

  await room.populate("createdBy", "name avatarUrl");

  res.status(201).json({
    success: true,
    message: "Room created successfully",
    data: { room },
  });
});

// GET /api/rooms/:id/messages — paginated message history
export const getRoomMessages = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(parseInt(req.query.limit) || 30, 50);

  const room = await Room.findById(req.params.id);
  if (!room) {
    res.status(404);
    throw new Error("Room not found");
  }

  // DM — only participants can fetch history
  if (room.type === "dm") {
    const isMember = room.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isMember) {
      res.status(403);
      throw new Error("Not authorized to view this conversation");
    }
  }

  const [messages, total] = await Promise.all([
    Message.find({ room: req.params.id })
      .populate("sender", "name avatarUrl")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Message.countDocuments({ room: req.params.id }),
  ]);

  // Reverse so oldest message comes first
  messages.reverse();

  res.status(200).json({
    success: true,
    message: "Messages fetched successfully",
    data: {
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
});

// GET /api/dms — list current user's DM conversations
export const getDMs = asyncHandler(async (req, res) => {
  const dms = await Room.find({
    type: "dm",
    participants: req.user._id,
  })
    .populate("participants", "name avatarUrl lastSeen")
    .populate("lastMessage")
    .sort({ updatedAt: -1 });

  res.status(200).json({
    success: true,
    message: "DMs fetched successfully",
    data: { dms },
  });
});

// POST /api/dms/:userId — get or create a DM with someone
export const getOrCreateDM = asyncHandler(async (req, res) => {
  const otherUserId = req.params.userId;
  const currentUserId = req.user._id;

  if (otherUserId === currentUserId.toString()) {
    res.status(400);
    throw new Error("Cannot create a DM with yourself");
  }

  const otherUser = await User.findById(otherUserId);
  if (!otherUser) {
    res.status(404);
    throw new Error("User not found");
  }

  // Check if DM already exists between these two users
  let dm = await Room.findOne({
    type: "dm",
    participants: { $all: [currentUserId, otherUserId], $size: 2 },
  }).populate("participants", "name avatarUrl lastSeen");

  if (!dm) {
    dm = await Room.create({
      name: `dm-${currentUserId.toString().slice(-8)}-${otherUserId.toString().slice(-8)}`,
      type: "dm",
      participants: [currentUserId, otherUserId],
      createdBy: currentUserId,
    });
    await dm.populate("participants", "name avatarUrl lastSeen");
  }

  res.status(200).json({
    success: true,
    message: "DM fetched successfully",
    data: { room: dm },
  });
});