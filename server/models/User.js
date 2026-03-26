const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async findByEmail(email) {
    try {
      console.log('Finding user by email:', email);
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );
      console.log('Query result:', rows.length > 0 ? 'User found' : 'User not found');
      return rows[0];
    } catch (error) {
      console.error('Error in findByEmail:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT id, email, display_name, created_at FROM users WHERE id = ?',
        [id]
      );
      return rows[0];
    } catch (error) {
      console.error('Error in findById:', error);
      throw error;
    }
  }

  static async create(email, password, displayName) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const [result] = await pool.execute(
        'INSERT INTO users (email, password_hash, display_name) VALUES (?, ?, ?)',
        [email, hashedPassword, displayName]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  static async validatePassword(plainPassword, hashedPassword) {
    try {
      const isValid = await bcrypt.compare(plainPassword, hashedPassword);
      console.log('Password validation:', isValid ? 'SUCCESS' : 'FAILED');
      return isValid;
    } catch (error) {
      console.error('Error in validatePassword:', error);
      throw error;
    }
  }
}

module.exports = User;