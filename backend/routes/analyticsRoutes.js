const express = require('express');
const { protect } = require('../middleware/auth');
const { getAnalytics } = require('../controllers/analyticsController');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getAnalytics);

module.exports = router;
