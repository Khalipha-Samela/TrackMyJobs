const express = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/login', 
  loginLimiter,
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  AuthController.login
);

router.post('/register',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('display_name').notEmpty().withMessage('Display name is required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('confirmPassword').notEmpty().withMessage('Please confirm your password')
  ],
  AuthController.register
);

router.get('/verify', 
  authenticateToken,
  AuthController.verify
);

module.exports = router;