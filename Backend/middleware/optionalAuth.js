import jwt from "jsonwebtoken";
import User from "../models/User.js";

const optionalAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-passwordHash");

    if (user) {
      req.user = user;
    }
  } catch (error) {
    console.warn(`Optional auth skipped: ${error.message}`);
  }

  next();
};

export default optionalAuth;
