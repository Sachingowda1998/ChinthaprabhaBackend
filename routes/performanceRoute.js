const express = require('express');
const Performer = express.Router();
const performanceController = require('../controllers/performanceController');
const multer = require('multer');



const storage = multer.memoryStorage();

const performanceUpload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // optional: 100MB max
});

Performer.post(
  '/',
  performanceUpload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  performanceController.createPerformance
);

// ✅ Update Performance
Performer.put(
  '/:id',
  performanceUpload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  performanceController.updatePerformance
);

// ✅ Delete, Get All, Get by ID
Performer.delete('/:id', performanceController.deletePerformance);
Performer.get('/', performanceController.getAllPerformances);
Performer.get('/:id', performanceController.getPerformanceById);

module.exports = Performer;
