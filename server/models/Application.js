const pool = require('../config/database');

class Application {
  static async getAll(userId, offset = 0, limit = 10) {
    const [rows] = await pool.execute(
      `SELECT * FROM applications 
       WHERE user_id = ? 
       ORDER BY application_date DESC, created_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
    return rows;
  }

  static async getById(id, userId) {
    const [rows] = await pool.execute(
      'SELECT * FROM applications WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows[0];
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

    // Convert null/undefined to null for MySQL
    const safeJobLink = job_link || null;
    const safeNotes = notes || null;
    const safeCvFilename = cv_filename || null;
    const safeCvOriginalName = cv_original_name || null;
    const safeCvMimeType = cv_mime_type || null;
    const safeCvSize = cv_size || null;

    const [result] = await pool.execute(
      `INSERT INTO applications 
       (user_id, company_name, job_title, job_link, application_date, status, notes, 
        cv_filename, cv_original_name, cv_mime_type, cv_size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, company_name, job_title, safeJobLink, application_date, status, safeNotes,
       safeCvFilename, safeCvOriginalName, safeCvMimeType, safeCvSize]
    );
    
    return result.insertId;
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

    // Convert null/undefined to null for MySQL
    const safeJobLink = job_link || null;
    const safeNotes = notes || null;
    const safeCvFilename = cv_filename || null;
    const safeCvOriginalName = cv_original_name || null;
    const safeCvMimeType = cv_mime_type || null;
    const safeCvSize = cv_size || null;

    const [result] = await pool.execute(
      `UPDATE applications 
       SET company_name = ?, job_title = ?, job_link = ?, 
           application_date = ?, status = ?, notes = ?,
           cv_filename = ?, cv_original_name = ?, cv_mime_type = ?, cv_size = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [company_name, job_title, safeJobLink, application_date, status, safeNotes,
       safeCvFilename, safeCvOriginalName, safeCvMimeType, safeCvSize, id, userId]
    );
    
    return result.affectedRows > 0;
  }

  static async delete(id, userId) {
    const [rows] = await pool.execute(
      'SELECT cv_filename FROM applications WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    const cvFilename = rows[0]?.cv_filename;
    
    const [result] = await pool.execute(
      'DELETE FROM applications WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    return { success: result.affectedRows > 0, cvFilename };
  }

  static async getStats(userId) {
    const [rows] = await pool.execute(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Applied' THEN 1 ELSE 0 END) as applied,
        SUM(CASE WHEN status = 'Interview' THEN 1 ELSE 0 END) as interview,
        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) as rejected,
        SUM(CASE WHEN status = 'Offer' THEN 1 ELSE 0 END) as offer
       FROM applications 
       WHERE user_id = ?`,
      [userId]
    );
    return rows[0];
  }

  static async count(userId) {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as total FROM applications WHERE user_id = ?',
      [userId]
    );
    return rows[0].total;
  }
}

module.exports = Application;