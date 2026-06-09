const express = require('express');
const router = express.Router();
const {
  toggleLike,
  addComment,
  deleteComment,
  toggleFavourite,
  tagUser,
  getMediaLikes,
  getMediaComments,
  downloadMedia,
  getNotifications,
  markNotificationsRead
} = require('../controllers/social.controller');
const { protect } = require('../middleware/auth.middleware');

// All routes require login
router.post('/like/:mediaId', protect, toggleLike);
router.post('/comment/:mediaId', protect, addComment);
router.delete('/comment/:commentId', protect, deleteComment);
router.post('/favourite/:mediaId', protect, toggleFavourite);
router.post('/tag/:mediaId', protect, tagUser);
router.get('/likes/:mediaId', getMediaLikes);
router.get('/comments/:mediaId', getMediaComments);
router.get('/download/:mediaId', protect, downloadMedia);
router.get('/notifications', protect, getNotifications);
router.put('/notifications/read', protect, markNotificationsRead);

module.exports = router;