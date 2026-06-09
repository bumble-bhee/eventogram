const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  uploadMedia,
  getEventMedia,
  getMediaById,
  deleteMedia
} = require('../controllers/media.controller');
const { protect } = require('../middleware/auth.middleware');
const { upload } = require('../services/s3.service');

// Get all media for an event (public)
router.get('/', protect, getEventMedia);

// Get single media
router.get('/:mediaId', protect, getMediaById);

// Upload media (protected) - supports bulk upload (array of files, max 20)
router.post(
  '/upload',
  protect,
  upload.array('media', 20),
  uploadMedia
);

// Delete media (protected)
router.delete('/:mediaId', protect, deleteMedia);

module.exports = router;