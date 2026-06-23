import bcrypt from "bcrypt";
import User from "../models/User.js";
import { generateToken } from "../utils/jwt.js";

const SALT_ROUNDS = 10;

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    const isDbError = error.message?.includes('buffering timed out') || error.message?.includes('ECONNREFUSED') || error.message?.includes('MongoNetworkError');
    if (isDbError) {
      return res.status(503).json({ message: "Database unavailable. Check your MONGO_URI in .env and ensure MongoDB Atlas credentials are correct." });
    }
    res.status(500).json({ message: "Signup failed", error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    const isDbError = error.message?.includes('buffering timed out') || error.message?.includes('ECONNREFUSED') || error.message?.includes('MongoNetworkError');
    if (isDbError) {
      return res.status(503).json({ message: "Database unavailable. Check your MONGO_URI in .env and ensure MongoDB Atlas credentials are correct." });
    }
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};
