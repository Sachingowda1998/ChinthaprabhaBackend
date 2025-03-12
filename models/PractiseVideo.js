const mongoose = require('mongoose');

const practiseVideoSchema = new mongoose.Schema({
  videoUrl: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rating: { type: Number, default: 0 }, 
  lessonId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('PractiseVideo', practiseVideoSchema);