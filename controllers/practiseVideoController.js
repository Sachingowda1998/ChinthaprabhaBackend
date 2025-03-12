const PractiseVideo = require('../models/PractiseVideo');
const Lesson = require('../models/LessonModel');

// Upload practice video
exports.uploadPractiseVideo = async (req, res) => {
  try {
    const { lessonId, userId } = req.body;
    if (!lessonId || !userId) {
      return res.status(400).json({ message: 'Lesson ID and User ID are required' });
    }

    // Check if a video already exists for this lesson and user
    const existingVideo = await PractiseVideo.findOne({ lessonId, userId });

    if (existingVideo) {
      // Update the existing video
      existingVideo.videoUrl = req.file.path;
      existingVideo.status = 'pending'; // Reset status to pending
      existingVideo.rating = 0; // Reset rating to 0
      await existingVideo.save();
      return res.status(200).json({ message: 'Practice video re-uploaded successfully', practiseVideo: existingVideo });
    } else {
      // Create a new video entry
      const practiseVideo = new PractiseVideo({
        videoUrl: req.file.path,
        lessonId,
        userId,
        rating: 0, // Default rating is 0
      });

      await practiseVideo.save();
      return res.status(201).json({ message: 'Practice video uploaded successfully', practiseVideo });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error uploading practice video', error: error.message });
  }
};

// Approve or reject practice video
exports.approveRejectPractiseVideo = async (req, res) => {
  try {
    const { status, rating } = req.body; // Add rating to the request body
    const { id } = req.params;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const practiseVideo = await PractiseVideo.findByIdAndUpdate(
      id,
      { status, rating }, // Update status and rating
      { new: true }
    );

    if (!practiseVideo) {
      return res.status(404).json({ message: 'Practice video not found' });
    }

    // If approved and rating is 4 or more, unlock the next lesson
    if (status === 'approved' && rating >= 4) {
      const lesson = await Lesson.findById(practiseVideo.lessonId);
      console.log('Current Lesson:', lesson); // Debugging

      if (lesson) {
        // Find the next lesson in the same course
        const nextLesson = await Lesson.findOne({
          course: lesson.course,
          _id: { $gt: lesson._id }, // Get the next lesson based on _id
        }).sort({ _id: 1 }); // Sort to get the next lesson

        console.log('Next Lesson Found:', nextLesson); // Debugging

        if (nextLesson) {
          nextLesson.locked = false; // Unlock the next lesson
          await nextLesson.save(); // Ensure the lesson is saved
          console.log('Next Lesson Unlocked:', nextLesson); // Debugging
        } else {
          console.log('No next lesson found'); // Debugging
        }
      }
    }

    res.status(200).json({ message: `Practice video ${status}`, practiseVideo });
  } catch (error) {
    res.status(500).json({ message: 'Error updating practice video status', error: error.message });
  }
};
// Fetch video status by lessonId and userId
exports.getVideoStatus = async (req, res) => {
  try {
    const { lessonId, userId } = req.params;
    const practiseVideo = await PractiseVideo.findOne({ lessonId, userId });

    if (!practiseVideo) {
      return res.status(404).json({ message: 'Practice video not found' });
    }

    res.status(200).json({ status: practiseVideo.status, rating: practiseVideo.rating });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching video status', error: error.message });
  }
};
// Fetch all practice videos for admin
exports.getAllPractiseVideos = async (req, res) => {
  try {
    const practiseVideos = await PractiseVideo.find().populate('lessonId userId');
    res.status(200).json({ practiseVideos });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching practice videos', error: error.message });
  }
};