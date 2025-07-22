const mongoose = require('mongoose');

const audienceReviewSchema = new mongoose.Schema({
  video: {
    type: String,
    required: true
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
  description: {
    type: String,
    required: true
  }
}, { timestamps: true });

const AudienceModel= mongoose.model('audienceReview', audienceReviewSchema);
module.exports={AudienceModel}