import express from "express";
import { getDMs, getOrCreateDM } from "../controllers/room.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", verifyJWT, getDMs);
router.post("/:userId", verifyJWT, getOrCreateDM);

export default router;