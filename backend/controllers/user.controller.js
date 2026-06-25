import asyncHandler from "express-async-handler";
import User from "../models/User.js";

// GET /api/users/search?q= — search users by name for starting DMs
export const searchUsers = asyncHandler(async (req, res) => {
  const q = req.query.q?.trim();

  if (!q || q.length < 2) {
    res.status(400);
    throw new Error("Search query must be at least 2 characters");
  }

  const users = await User.find({
    _id: { $ne: req.user._id }, // exclude current user
    name: { $regex: q, $options: "i" },
  })
    .select("name avatarUrl lastSeen")
    .limit(10);

  res.status(200).json({
    success: true,
    message: "Users found",
    data: { users },
  });
});

// GET /api/users — list all users except current user
export const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ _id: { $ne: req.user._id } })
    .select("name avatarUrl lastSeen")
    .sort({ name: 1 })
    .limit(50);

  res.status(200).json({
    success: true,
    message: "Users fetched successfully",
    data: { users },
  });
});