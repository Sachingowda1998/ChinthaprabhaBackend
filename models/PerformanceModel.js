const mongoose = require('mongoose');

const performanceSchema = new mongoose.Schema({
  video: {
    type: String, // S3 URL or local path
    required: false // Make it optional if using either video or link
  },
  videoLink: {
    type: String, // YouTube or other external link
    required: false
  },
  name: {
    type: String,
    required: true
  },
  photo: {
    type: String,
    required: true
  },
  skillLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: true
  },
  thumbnail: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  }
}, { timestamps: true });

const PerformanceModel = mongoose.model('Performance', performanceSchema);
module.exports = { PerformanceModel };
