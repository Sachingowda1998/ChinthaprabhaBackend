const { uploadFile2, deleteFile } = require('../middleware/aws');
const { AudienceModel } = require('../models/AudienceModel');

// CREATE Audience Review
exports.createAudienceReview = async (req, res) => {
  try {
    const { name, skillLevel, description } = req.body;

    if (!req.files || !req.files.video || !req.files.photo || !req.files.thumbnail) {
      return res.status(400).json({ message: 'Video, photo, and thumbnail are required' });
    }

    const videoUrl = await uploadFile2(req.files.video[0], 'AudienceReview');
    const photoUrl = await uploadFile2(req.files.photo[0], 'AudienceReview');
    const thumbnailUrl = await uploadFile2(req.files.thumbnail[0], 'AudienceReview');

    const newAudienceReview = new AudienceModel({
      name,
      skillLevel,
      description,
      video: videoUrl,
      photo: photoUrl,
      thumbnail: thumbnailUrl,
    });

    const saved = await newAudienceReview.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Error uploading AudienceReview', error: error.message });
  }
};

// UPDATE Audience Review
exports.updateAudienceReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, skillLevel, description } = req.body;

    const audienceReview = await AudienceModel.findById(id);
    if (!audienceReview) {
      return res.status(404).json({ message: 'AudienceReview not found' });
    }

    const updateData = {
      name: name ?? audienceReview.name,
      skillLevel: skillLevel ?? audienceReview.skillLevel,
      description: description ?? audienceReview.description,
    };

    // Upload new files and delete old ones
    if (req.files?.video) {
      await deleteFile(audienceReview.video);
      updateData.video = await uploadFile2(req.files.video[0], 'AudienceReview');
    }

    if (req.files?.photo) {
      await deleteFile(audienceReview.photo);
      updateData.photo = await uploadFile2(req.files.photo[0], 'AudienceReview');
    }

    if (req.files?.thumbnail) {
      await deleteFile(audienceReview.thumbnail);
      updateData.thumbnail = await uploadFile2(req.files.thumbnail[0], 'AudienceReview');
    }

    const updated = await AudienceModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating AudienceReview', error: error.message });
  }
};

// DELETE Audience Review
exports.deleteAudienceReview = async (req, res) => {
  try {
    const { id } = req.params;
    const audienceReview = await AudienceModel.findByIdAndDelete(id);

    if (!audienceReview) {
      return res.status(404).json({ message: 'AudienceReview not found' });
    }

    await Promise.all([
      deleteFile(audienceReview.video),
      deleteFile(audienceReview.photo),
      deleteFile(audienceReview.thumbnail),
    ]);

    res.json({ message: 'AudienceReview deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting AudienceReview', error: error.message });
  }
};

// GET All Audience Reviews
exports.getAllAudienceReview = async (req, res) => {
  try {
    const reviews = await AudienceModel.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET Audience Review by ID
exports.getAudienceReviewById = async (req, res) => {
  try {
    const review = await AudienceModel.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ message: 'AudienceReview not found' });
    }
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
