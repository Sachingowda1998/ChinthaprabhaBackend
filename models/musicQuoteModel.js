const mongoose = require("mongoose");

const quoteSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, "Quote text is required"],
      trim: true,
    },
    artist: {
      type: String,
      required: [true, "Artist is required"],
      trim: true,
    },
    genre: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quote", quoteSchema);
