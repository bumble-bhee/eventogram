const express = require('express');
const router = express.Router();
const { saveFaceDescriptor, findMyPhotos, checkDescriptor, tagFacesInPhoto, scanAllPhotos } = require('../controllers/face.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/save-descriptor', protect, saveFaceDescriptor);
router.get('/my-photos', protect, findMyPhotos);
router.get('/check-descriptor', protect, checkDescriptor);
router.post('/tag-faces', protect, tagFacesInPhoto);
router.post('/scan-all-photos', protect, scanAllPhotos);

module.exports = router;