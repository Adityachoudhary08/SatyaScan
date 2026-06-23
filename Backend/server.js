import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import apiRoutes from "./routes/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
  ],
  credentials: true,
}));
app.use(express.json());

app.use("/api", apiRoutes);

connectDB();

app.listen(PORT, () => {
  console.log(`TruthLens server running on port ${PORT}`);
});
