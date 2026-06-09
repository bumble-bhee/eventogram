const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent
} = require('../controllers/event.controller');

// Public - anyone can view public events
router.get('/', protect, getAllEvents);
router.get('/:id', protect, getEventById);

// Protected - only logged in users
router.post('/', protect, authorize('ADMIN', 'PHOTOGRAPHER', 'CLUB_MEMBER'), createEvent);
router.put('/:id', protect, authorize('ADMIN', 'CLUB_MEMBER'), updateEvent);
router.delete('/:id', protect, authorize('ADMIN'), deleteEvent);

module.exports = router;