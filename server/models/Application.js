const pool = require('../config/database');

class Application {
  static async getAll(userId, offset = 0, limit = 10) {
    const result = await pool.query(
      `SELECT * FROM applications 
       WHERE user_id = $1 
       ORDER BY application_date DESC, created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return result.rows;
  }

  static async getById(id, userId) {
    const result = await pool.query(
      'SELECT * FROM applications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    return result.rows[0];
  }

  static async create(data, userId) {
    const {
      company_name,
      job_title,
      job_link,
      application_date,
      status,
      notes,
      cv_filename,
      cv_original_name,
      cv_mime_type,
      cv_size
    } = data;

    const result = await pool.query(
      `INSERT INTO applications 
       (user_id, company_name, job_title, job_link, application_date, status, notes, 
        cv_filename, cv_original_name, cv_mime_type, cv_size)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id`,
      [userId, company_name, job_title, job_link || null, application_date, 
       status, notes || null, cv_filename || null, cv_original_name || null, 
       cv_mime_type || null, cv_size || null]
    );
    
    return result.rows[0].id;
  }

  static async update(id, userId, data) {
    const {
      company_name,
      job_title,
      job_link,
      application_date,
      status,
      notes,
      cv_filename,
      cv_original_name,
      cv_mime_type,
      cv_size
    } = data;

    const result = await pool.query(
      `UPDATE applications 
       SET company_name = $1, job_title = $2, job_link = $3, 
           application_date = $4, status = $5, notes = $6,
           cv_filename = $7, cv_original_name = $8, cv_mime_type = $9, cv_size = $10,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11 AND user_id = $12`,
      [company_name, job_title, job_link || null, application_date, status, 
       notes || null, cv_filename || null, cv_original_name || null, 
       cv_mime_type || null, cv_size || null, id, userId]
    );
    
    return result.rowCount > 0;
  }

  static async delete(id, userId) {
    // Get CV filename first
    const selectResult = await pool.query(
      'SELECT cv_filename FROM applications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    const cvFilename = selectResult.rows[0]?.cv_filename;
    
    // Delete application
    const deleteResult = await pool.query(
      'DELETE FROM applications WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    return { success: deleteResult.rowCount > 0, cvFilename };
  }

  static async getStats(userId) {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Applied' THEN 1 ELSE 0 END) as applied,
        SUM(CASE WHEN status = 'Interview' THEN 1 ELSE 0 END) as interview,
        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'Offer' THEN 1 ELSE 0 END) as offer
       FROM applications 
       WHERE user_id = $1`,
      [userId]
    );
    return result.rows[0];
  }

  static async count(userId) {
    const result = await pool.query(
      'SELECT COUNT(*) as total FROM applications WHERE user_id = $1',
      [userId]
    );
    return parseInt(result.rows[0].total);
  }
}

module.exports = Application;