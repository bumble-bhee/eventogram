const express = require('express');
const router = express.Router();
const { register, login, getMe, updateAvatar, searchUsers } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/users/search', protect, searchUsers);

// Avatar upload — only load S3 when this specific route is hit
router.post('/avatar', protect, (req, res, next) => {
  try {
    const { upload } = require('../services/s3.service');
    upload.single('avatar')(req, res, next);
  } catch (err) {
    res.status(500).json({ message: 'S3 service unavailable', error: err.message });
  }
}, updateAvatar);

module.exports = router;