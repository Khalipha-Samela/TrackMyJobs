const supabase = require('../config/supabase');

class Application {
  static async getAll(userId, offset = 0, limit = 10) {
    const { data, error, count } = await supabase
      .from('applications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('application_date', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    return { data, count };
  }

  static async getById(id, userId) {
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    return data;
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

    const { data: result, error } = await supabase
      .from('applications')
      .insert([{
        user_id: userId,
        company_name,
        job_title,
        job_link: job_link || null,
        application_date,
        status: status || 'Applied',
        notes: notes || null,
        cv_filename: cv_filename || null,
        cv_original_name: cv_original_name || null,
        cv_mime_type: cv_mime_type || null,
        cv_size: cv_size || null
      }])
      .select()
      .single();
    
    if (error) throw error;
    return result.id;
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

    const updateData = {
      company_name,
      job_title,
      job_link: job_link || null,
      application_date,
      status,
      notes: notes || null,
      updated_at: new Date().toISOString()
    };

    if (cv_filename !== undefined) updateData.cv_filename = cv_filename;
    if (cv_original_name !== undefined) updateData.cv_original_name = cv_original_name;
    if (cv_mime_type !== undefined) updateData.cv_mime_type = cv_mime_type;
    if (cv_size !== undefined) updateData.cv_size = cv_size;

    const { error } = await supabase
      .from('applications')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) throw error;
    return true;
  }

  static async delete(id, userId) {
    // Get CV filename first
    const { data: app } = await supabase
      .from('applications')
      .select('cv_filename')
      .eq('id', id)
      .eq('user_id', userId)
      .single();
    
    const cvFilename = app?.cv_filename;
    
    // Delete application
    const { error } = await supabase
      .from('applications')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    
    if (error) throw error;
    return { success: true, cvFilename };
  }

  static async getStats(userId) {
    const { data, error } = await supabase
      .from('applications')
      .select('status')
      .eq('user_id', userId);
    
    if (error) throw error;
    
    const stats = {
      total: data.length,
      applied: data.filter(a => a.status === 'Applied').length,
      interview: data.filter(a => a.status === 'Interview').length,
      rejected: data.filter(a => a.status === 'Rejected').length,
      offer: data.filter(a => a.status === 'Offer').length
    };
    
    return stats;
  }

  static async count(userId) {
    const { count, error } = await supabase
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (error) throw error;
    return count;
  }
}

module.exports = Application;