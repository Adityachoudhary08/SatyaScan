import mongoose from "mongoose";

const claimSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
    },
    verdict: {
      type: String,
      required: true,
    },
    sources: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const checkSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  inputType: {
    type: String,
    enum: ["text", "url", "image"],
    required: true,
  },
  originalText: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    default: "en",
  },
  claims: {
    type: [claimSchema],
    default: [],
  },
  aiScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  sourceScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  trustScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Check = mongoose.model("Check", checkSchema);

export default Check;
