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
        instrumentName: { type: String },
        instrumentDescription: { type: String },
        instrumentImage: { type: String },
        category: { type: String },
        subcategory: { type: String },
        gst: { type: Number, default: 0 },
        tax: { type: Number, default: 0 },
        deliveryFee: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },
      },
    ],
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ["processing", "shipped", "delivered", "cancelled"],
      default: "processing",
    },
    address: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
