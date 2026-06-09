const express = require('express');
const router = express.Router();
const { searchMedia } = require('../controllers/search.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, searchMedia);

module.exports = router;

