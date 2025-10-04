const mongoose = require("mongoose");

const fundSchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Fund", fundSchema);
