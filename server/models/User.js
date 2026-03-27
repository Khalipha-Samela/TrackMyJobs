const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

class User {
  static async findByEmail(email) {
    try {
      console.log('Finding user by email:', email);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error in findByEmail:', error);
      throw error;
    }
  }

  static async findById(id) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, display_name, created_at')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error in findById:', error);
      throw error;
    }
  }

  static async create(email, password, displayName) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const { data, error } = await supabase
        .from('users')
        .insert([{ email, password_hash: hashedPassword, display_name: displayName }])
        .select()
        .single();
      
      if (error) throw error;
      console.log('User created with ID:', data.id);
      return data.id;
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