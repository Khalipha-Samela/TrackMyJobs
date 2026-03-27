const supabase = require('../config/supabase');

class Application {
  static async getAll(userId, offset = 0, limit = 10) {
    try {
      console.log('Application.getAll - User ID:', userId);
      console.log('Application.getAll - Offset:', offset, 'Limit:', limit);
    
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
    
      console.log(`Found ${data?.length || 0} applications, total count: ${count || 0}`);
    
      // Log the actual data to see what's coming back
      if (data && data.length > 0) {
        console.log('Sample application:', JSON.stringify(data[0], null, 2));
      } else {
        console.log('No applications found for user:', userId);
      
        // Let's check if the user exists in the users table
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
      
        console.log('User exists in database?', userData ? 'Yes' : 'No');
        if (userError) console.log('User lookup error:', userError);
      
        // Let's check if there are ANY applications in the table
        const { data: allApps, error: allAppsError } = await supabase
          .from('applications')
          .select('*')
          .limit(5);
      
        console.log('Any applications in table?', allApps?.length || 0);
        if (allApps && allApps.length > 0) {
          console.log('Sample application from table:', allApps[0]);
          console.log('User ID in that application:', allApps[0].user_id);
          console.log('Looking for user ID:', userId);
        }
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
      
      console.log('Stats calculated:', stats);
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