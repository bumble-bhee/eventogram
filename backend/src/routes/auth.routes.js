const express = require('express');
const router = express.Router();
const { register, login, getMe, updateAvatar, searchUsers } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { upload } = require('../services/s3.service');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/avatar', protect, upload.single('avatar'), updateAvatar);
router.get('/users/search', protect, searchUsers);

module.exports = router;