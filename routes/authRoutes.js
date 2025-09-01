import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";
import User from "../models/User.js"; 

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password"); 
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});
export default router;
