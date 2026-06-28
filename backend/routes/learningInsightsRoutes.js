const express = require('express');
const { protect } = require('../middleware/auth');
const { getLearningInsights } = require('../controllers/aiLearningInsightsController');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getLearningInsights);

module.exports = router;
