const supabase = require('../config/supabase');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');
const { validationResult } = require('express-validator');

class AuthController {
  static async login(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    try {
      console.log('Login attempt for email:', email);
    
      // Find user by email using Supabase
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email);
    
      if (userError) {
        console.error('Supabase error:', userError);
        return res.status(500).json({
          success: false,
          message: 'Database error'
        });
      }
    
      const user = users?.[0];
    
      if (!user) {
        console.log('User not found:', email);
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
      if (!isValidPassword) {
        console.log('Invalid password for user:', email);
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      // Generate JWT token with the correct user ID
      const token = jwt.sign(
        { id: user.id, email: user.email, displayName: user.display_name },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log('Login successful for user:', email);
      console.log('User ID in token:', user.id);
    
      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during login: ' + error.message
      });
    }
  }

  static async register(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, display_name, password, confirmPassword } = req.body;

    // Check if passwords match
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    // Check password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long'
      });
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address'
      });
    }

    // Validate display name
    if (!display_name || display_name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Display name must be at least 2 characters'
      });
    }

    try {
      console.log('Registration attempt for email:', email);
      
      // Check if user already exists
      const existingUser = await User.findByEmail(email);
      
      if (existingUser) {
        console.log('Email already exists:', email);
        return res.status(400).json({
          success: false,
          message: 'An account with that email already exists'
        });
      }

      // Create new user
      const userId = await User.create(email, password, display_name);
      
      // Generate JWT token
      const token = jwt.sign(
        { id: userId, email: email, displayName: display_name },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      console.log('Registration successful for user:', email);
      
      res.status(201).json({
        success: true,
        token,
        user: {
          id: userId,
          email: email,
          displayName: display_name
        },
        message: 'Registration successful!'
      });
    } catch (error) {
      console.error('Registration error details:', error);
      res.status(500).json({
        success: false,
        message: 'Server error during registration: ' + error.message
      });
    }
  }

  static async verify(req, res) {
    res.json({
      success: true,
      user: req.user
    });
  }
}

module.exports = AuthController;