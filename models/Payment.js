const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
    courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    paymentDate: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending',
    },
    transactionId: {  // New field for transaction ID
        type: String,
      //  required: true,
        unique: true,  // Ensure transaction ID is unique
    },
});

// Function to generate a static or custom transaction ID
paymentSchema.pre('save', function (next) {
    if (!this.transactionId) {
        // Generate a transaction ID (example format: 'TXN-<timestamp>-<randomString>')
        this.transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    }
    next();
});

module.exports = mongoose.model('Payment', paymentSchema);
