import express from "express";
import { searchUsers, getUsers } from "../controllers/user.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", verifyJWT, getUsers);
router.get("/search", verifyJWT, searchUsers);

export default router;