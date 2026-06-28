const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getPrompts,
  getPrompt,
  createPrompt,
  updatePrompt,
  deletePrompt,
  toggleFavoritePrompt,
} = require('../controllers/promptController');
const { validatePrompt, validateUpdatePrompt } = require('../middleware/validation');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getPrompts)
  .post(validatePrompt, createPrompt);

router.route('/:id')
  .get(getPrompt)
  .put(validateUpdatePrompt, updatePrompt)
  .delete(deletePrompt);

router.route('/:id/favorite')
  .patch(toggleFavoritePrompt);

module.exports = router;
