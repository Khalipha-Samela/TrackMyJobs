import { createClient } from '@supabase/supabase-js';

// Get from environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Validate
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(' Missing Supabase credentials! Check your environment variables.');
  throw new Error('Supabase credentials are missing. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth functions
export const login = async (email, password) => {
  try {
    console.log(' Attempting login for:', email);
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    
    if (error) {
      console.error('Supabase error:', error);
      throw new Error('Database error');
    }
    
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    // For demo user, check password
    if (email === 'demo@trackmyjobs.com' && password !== 'changeme123') {
      throw new Error('Invalid email or password');
    }
    
    localStorage.setItem('trackmyjobs_user', JSON.stringify(user));
    console.log(' Login successful for:', email);
    return { user };
  } catch (error) {
    console.error('Login error:', error.message);
    throw error;
  }
};

export const register = async (email, password, displayName) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .insert([{
        email,
        password_hash: 'temp_hash',
        display_name: displayName
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    localStorage.setItem('trackmyjobs_user', JSON.stringify(user));
    return { user };
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

export const logout = async () => {
  localStorage.removeItem('trackmyjobs_user');
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('trackmyjobs_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

// Application functions
export const getApplications = async (userId, page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  
  const { data, error, count } = await supabase
    .from('applications')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('application_date', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (error) throw error;
  return { data, count };
};

export const getApplicationById = async (id, userId) => {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error) throw error;
  return data;
};

export const createApplication = async (userId, applicationData, cvFile) => {
  let cvData = {};
  
  if (cvFile) {
    const fileExt = cvFile.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('cvs')
      .upload(fileName, cvFile, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) throw uploadError;
    
    cvData = {
      cv_filename: fileName,
      cv_original_name: cvFile.name,
      cv_mime_type: cvFile.type,
      cv_size: cvFile.size
    };
  }
  
  const { data, error } = await supabase
    .from('applications')
    .insert([{
      user_id: userId,
      ...applicationData,
      ...cvData
    }])
    .select();
  
  if (error) throw error;
  return data[0];
};

export const updateApplication = async (id, userId, applicationData, cvFile, removeCv = false) => {
  let updateData = { ...applicationData };
  
  if (removeCv) {
    const { data: existing } = await supabase
      .from('applications')
      .select('cv_filename')
      .eq('id', id)
      .maybeSingle();
    
    if (existing?.cv_filename) {
      await supabase.storage.from('cvs').remove([existing.cv_filename]);
      updateData.cv_filename = null;
      updateData.cv_original_name = null;
      updateData.cv_mime_type = null;
      updateData.cv_size = null;
    }
  }
  
  if (cvFile) {
    const { data: existing } = await supabase
      .from('applications')
      .select('cv_filename')
      .eq('id', id)
      .maybeSingle();
    
    if (existing?.cv_filename) {
      await supabase.storage.from('cvs').remove([existing.cv_filename]);
    }
    
    const fileExt = cvFile.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('cvs')
      .upload(fileName, cvFile);
    
    if (uploadError) throw uploadError;
    
    updateData.cv_filename = fileName;
    updateData.cv_original_name = cvFile.name;
    updateData.cv_mime_type = cvFile.type;
    updateData.cv_size = cvFile.size;
  }
  
  const { data, error } = await supabase
    .from('applications')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select();
  
  if (error) throw error;
  return data[0];
};

export const deleteApplication = async (id, userId) => {
  const { data: app } = await supabase
    .from('applications')
    .select('cv_filename')
    .eq('id', id)
    .maybeSingle();
  
  if (app?.cv_filename) {
    await supabase.storage.from('cvs').remove([app.cv_filename]);
  }
  
  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
  
  if (error) throw error;
  return true;
};

export const getApplicationsStats = async (userId) => {
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
};

export const downloadCV = async (filename, originalName) => {
  const { data, error } = await supabase.storage
    .from('cvs')
    .download(filename);
  
  if (error) throw error;
  
  const url = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = originalName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  return true;
};