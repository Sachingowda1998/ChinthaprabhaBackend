const { uploadFile2, deleteFile } = require('../middleware/aws');
const { PerformanceModel } = require('../models/performanceModel');

// CREATE Performance
exports.createPerformance = async (req, res) => {
  try {
    const { name, skillLevel, title } = req.body;

    if (!req.files?.video || !req.files?.photo || !req.files?.thumbnail) {
      return res.status(400).json({ message: 'Video, photo, and thumbnail are required' });
    }

    const [videoUrl, photoUrl, thumbnailUrl] = await Promise.all([
      uploadFile2(req.files.video[0], 'performance'),
      uploadFile2(req.files.photo[0], 'performance'),
      uploadFile2(req.files.thumbnail[0], 'performance'),
    ]);

    const newPerformance = new PerformanceModel({
      name,
      skillLevel,
      title,
      video: videoUrl,
      photo: photoUrl,
      thumbnail: thumbnailUrl,
    });

    const saved = await newPerformance.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ message: 'Error uploading performance', error: error.message });
  }
};

// UPDATE Performance
exports.updatePerformance = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, skillLevel, title } = req.body;

    const performance = await PerformanceModel.findById(id);
    if (!performance) {
      return res.status(404).json({ message: 'Performance not found' });
    }

    const updateData = {
      name: name ?? performance.name,
      skillLevel: skillLevel ?? performance.skillLevel,
      title: title ?? performance.title,
    };

    // Handle optional file updates
    if (req.files?.video) {
      await deleteFile(performance.video);
      updateData.video = await uploadFile2(req.files.video[0], 'performance');
    }

    if (req.files?.photo) {
      await deleteFile(performance.photo);
      updateData.photo = await uploadFile2(req.files.photo[0], 'performance');
    }

    if (req.files?.thumbnail) {
      await deleteFile(performance.thumbnail);
      updateData.thumbnail = await uploadFile2(req.files.thumbnail[0], 'performance');
    }

    const updated = await PerformanceModel.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating performance', error: error.message });
  }
};

// DELETE Performance
exports.deletePerformance = async (req, res) => {
  try {
    const { id } = req.params;
    const performance = await PerformanceModel.findByIdAndDelete(id);

    if (!performance) {
      return res.status(404).json({ message: 'Performance not found' });
    }

    await Promise.all([
      deleteFile(performance.video),
      deleteFile(performance.photo),
      deleteFile(performance.thumbnail),
    ]);

    res.json({ message: 'Performance deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting performance', error: error.message });
  }
};

// GET All Performances
exports.getAllPerformances = async (req, res) => {
  try {
    const performances = await PerformanceModel.find().sort({ createdAt: -1 });
    res.json(performances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET Single Performance by ID
exports.getPerformanceById = async (req, res) => {
  try {
    const performance = await PerformanceModel.findById(req.params.id);
    if (!performance) {
      return res.status(404).json({ message: 'Performance not found' });
    }
    res.json(performance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
