const supabase = require('../config/supabase');

class Application {
  static async getAll(userId, offset = 0, limit = 10) {
    try {
      console.log('Application.getAll - User ID:', userId);
      
      const { data, error, count } = await supabase
        .from('applications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('application_date', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (error) {
        console.error('Supabase error in getAll:', error);
        throw error;
      }
      
      return { 
        data: data || [], 
        count: count || 0 
      };
    } catch (error) {
      console.error('Error in Application.getAll:', error);
      throw error;
    }
  }

  static async getById(id, userId) {
    try {
      console.log('Application.getById - ID:', id, 'User ID:', userId);
      
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle();  // Use maybeSingle instead of single to avoid errors when not found
      
      if (error) {
        console.error('Supabase error in getById:', error);
        throw error;
      }
      
      console.log('Application found:', data ? 'Yes' : 'No');
      return data;
    } catch (error) {
      console.error('Error in Application.getById:', error);
      throw error;
    }
  }

  static async create(data, userId) {
    try {
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
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  }

  static async update(id, userId, data) {
    try {
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
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  }

  static async delete(id, userId) {
    try {
      // Get CV filename first
      const { data: app } = await supabase
        .from('applications')
        .select('cv_filename')
        .eq('id', id)
        .eq('user_id', userId)
        .maybeSingle();
      
      const cvFilename = app?.cv_filename;
      
      // Delete application
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);
      
      if (error) throw error;
      return { success: true, cvFilename };
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  }

  static async getStats(userId) {
    try {
      const { data, error } = await supabase
        .from('applications')
        .select('status')
        .eq('user_id', userId);
      
      if (error) throw error;
      
      const stats = {
        total: data?.length || 0,
        applied: data?.filter(a => a.status === 'Applied').length || 0,
        interview: data?.filter(a => a.status === 'Interview').length || 0,
        rejected: data?.filter(a => a.status === 'Rejected').length || 0,
        offer: data?.filter(a => a.status === 'Offer').length || 0
      };
      
      return stats;
    } catch (error) {
      console.error('Error in getStats:', error);
      return { total: 0, applied: 0, interview: 0, rejected: 0, offer: 0 };
    }
  }

  static async count(userId) {
    try {
      const { count, error } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error in count:', error);
      return 0;
    }
  }
}

module.exports = Application;