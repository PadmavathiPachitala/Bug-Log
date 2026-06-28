const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getBugs,
  getBug,
  createBug,
  updateBug,
  deleteBug,
  toggleFavorite,
  exportBugs,
} = require('../controllers/bugController');
const { validateBug, validateUpdateBug } = require('../middleware/validation');

const router = express.Router();

router.use(protect);

router.route('/').get(getBugs).post(validateBug, createBug);
router.route('/export').get(exportBugs);
router.route('/:id').get(getBug).put(validateUpdateBug, updateBug).delete(deleteBug);
router.route('/:id/favorite').patch(toggleFavorite);

module.exports = router;
