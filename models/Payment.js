const mongoose = require("mongoose")

const paymentSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  baseAmount: {
    type: Number,
    required: true,
  },
  taxAmount: {
    type: Number,
    required: true,
  },
  gstAmount: {
    type: Number,
    required: true,
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String,
    enum: ["credit_card", "debit_card", "upi", "net_banking", "wallet"],
    required: true,
  },
  paymentDetails: {
    cardNumber: String,
    cardHolderName: String,
    expiryMonth: String,
    expiryYear: String,
    cvv: String,
    upiId: String,
    bankName: String,
    walletType: String,
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  transactionId: {
    type: String,
    unique: true,
    required: true,
  },
  taxRate: {
    type: Number,
    default: 10, // 10% tax
  },
  gstRate: {
    type: Number,
    default: 18, // 18% GST
  },
})

module.exports = mongoose.model("Payment", paymentSchema)
