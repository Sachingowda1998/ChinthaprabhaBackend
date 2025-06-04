const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "customerModel",
    },
    customerModel: {
      type: String,
      required: true,
      enum: ["User", "Teacher"],
    },
    items: [
      {
        instrument: { type: mongoose.Schema.Types.ObjectId, ref: "Instrument" },
        quantity: { type: Number, default: 1 },
        price: { type: Number, required: true },
      },
    ],
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["processing", "shipped", "delivered", "cancelled"],
      default: "processing",
    },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
