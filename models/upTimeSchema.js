const mongoose = require("mongoose");

const updownSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
  },
  url: {
    type: String,
    required: true,
  },
  responseTimes: {
    type: [Number],
    default: [],
  },
  status: {
    type: String,
  },
  upCount: {
    type: Number,
    default: 0,
  },
  downCount: {
    type: Number,
    default: 0,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

const Updown = mongoose.model("updown", updownSchema);

module.exports = Updown;
