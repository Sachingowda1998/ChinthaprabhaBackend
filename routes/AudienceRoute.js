const express = require('express');
const router = express.Router();

const { createAudienceReview, deleteAudienceReview, getAllAudienceReview, getAudienceReviewById, updateAudienceReview } = require('../controllers/audienceReviewController.js');
const multer = require('multer');
const storage = multer.memoryStorage();

const performanceUpload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // optional: 100MB max
});
router.post(
  '/',
  performanceUpload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]),createAudienceReview
);

router.put(
  '/:id',
  performanceUpload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'photo', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]),updateAudienceReview

);

router.delete('/:id',deleteAudienceReview );
router.get('/',getAllAudienceReview);
router.get('/:id', getAudienceReviewById);

module.exports = router;
