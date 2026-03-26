const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async findByEmail(email) {
    try {
      console.log('Finding user by email:', email);
      const result = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error in findByEmail:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const result = await pool.query(
        'SELECT id, email, display_name, created_at FROM users WHERE id = $1',
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error in findById:', error);
      throw error;
    }
  }

  static async create(email, password, displayName) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query(
        'INSERT INTO users (email, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id',
        [email, hashedPassword, displayName]
      );
      console.log('User created with ID:', result.rows[0].id);
      return result.rows[0].id;
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