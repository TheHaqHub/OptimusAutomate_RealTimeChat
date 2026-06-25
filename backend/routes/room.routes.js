import express from "express";
import { body } from "express-validator";
import {
  getRooms,
  createRoom,
  getRoomMessages,
  getDMs,
  getOrCreateDM,
} from "../controllers/room.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", verifyJWT, getRooms);

router.post(
  "/",
  verifyJWT,
  [body("name").trim().notEmpty().withMessage("Room name is required")],
  createRoom
);

router.get("/:id/messages", verifyJWT, getRoomMessages);

export default router;