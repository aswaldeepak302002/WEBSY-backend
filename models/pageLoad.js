const mongoose = require("mongoose");

const pageLoadSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  cruxMetrics: {
    type: Object,
    required: true,
  },
  lighthouseMetrics: {
    type: Object,
    required: true,
  },
  performance: {
    type: Object,
    required: true,
  },
  screenshotBase64: {
    type: String, // Assuming the screenshot path is a string
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const pageLoad = mongoose.model("PageLoad", pageLoadSchema);

module.exports = pageLoad;
