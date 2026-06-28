const express = require('express');
const { register, login, logout } = require('../controllers/authController');
const { authLimiter } = require('../middleware/rateLimiter');
const { validateRegister, validateLogin } = require('../middleware/validation');

const router = express.Router();

router.use(authLimiter);

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/logout', logout);

module.exports = router;
