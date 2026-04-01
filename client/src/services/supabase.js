import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Auth functions - using your existing users table
export const signUp = async (email, password, displayName) => {
  // First, check if user already exists in your users table
  const { data: existingUser, error: checkError } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();
  
  if (existingUser) {
    throw new Error('User already exists');
  }
  
  // Hash password (in production, you'd want this on the backend)
  // For now, we'll use a simple approach - but you should really use Supabase Auth
  const bcrypt = require('bcryptjs');
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  // Insert into your users table
  const { data, error } = await supabase
    .from('users')
    .insert([{
      email,
      password_hash: hashedPassword,
      display_name: displayName
    }])
    .select()
    .single();
  
  if (error) throw error;
  
  // Create a session token (simplified - you should use JWT properly)
  const token = btoa(JSON.stringify({ id: data.id, email: data.email }));
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(data));
  
  return { user: data };
};

export const signIn = async (email, password) => {
  // Find user by email
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error || !user) {
    throw new Error('Invalid email or password');
  }
  
  // Verify password (using bcrypt - you'd need bcryptjs in your frontend)
  // For demo, we'll use a simple check since the hash is from bcrypt
  const bcrypt = require('bcryptjs');
  const isValid = bcrypt.compareSync(password, user.password_hash);
  
  if (!isValid) {
    throw new Error('Invalid email or password');
  }
  
  // Create a session token
  const token = btoa(JSON.stringify({ id: user.id, email: user.email }));
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  
  return { user };
};

export const signOut = async () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

export const getCurrentUser = async () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  
  try {
    const user = JSON.parse(userStr);
    // Verify user still exists in database
    const { data, error } = await supabase
      .from('users')
      .select('id, email, display_name')
      .eq('id', user.id)
      .single();
    
    if (error || !data) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return null;
    }
    
    return data;
  } catch (error) {
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
    .single();
  
  if (error) throw error;
  return data;
};

export const createApplication = async (userId, applicationData, cvFile) => {
  let cvData = null;
  
  // Upload CV to Supabase Storage if provided
  if (cvFile) {
    const fileName = `user_${userId}/${Date.now()}_${cvFile.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
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
      company_name: applicationData.company_name,
      job_title: applicationData.job_title,
      job_link: applicationData.job_link,
      application_date: applicationData.application_date,
      status: applicationData.status,
      notes: applicationData.notes,
      ...cvData
    }])
    .select();
  
  if (error) throw error;
  return data[0];
};

export const updateApplication = async (id, userId, applicationData, cvFile, removeCv = false) => {
  let updateData = { ...applicationData };
  
  // Handle CV removal
  if (removeCv) {
    // Get existing CV filename
    const { data: existing } = await supabase
      .from('applications')
      .select('cv_filename')
      .eq('id', id)
      .single();
    
    if (existing?.cv_filename) {
      await supabase.storage.from('cvs').remove([existing.cv_filename]);
      updateData.cv_filename = null;
      updateData.cv_original_name = null;
      updateData.cv_mime_type = null;
      updateData.cv_size = null;
    }
  }
  
  // Upload new CV if provided
  if (cvFile) {
    // Delete old CV if exists
    const { data: existing } = await supabase
      .from('applications')
      .select('cv_filename')
      .eq('id', id)
      .single();
    
    if (existing?.cv_filename) {
      await supabase.storage.from('cvs').remove([existing.cv_filename]);
    }
    
    const fileName = `user_${userId}/${Date.now()}_${cvFile.name}`;
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
  // Get CV filename
  const { data: app } = await supabase
    .from('applications')
    .select('cv_filename')
    .eq('id', id)
    .single();
  
  // Delete CV from storage if exists
  if (app?.cv_filename) {
    await supabase.storage.from('cvs').remove([app.cv_filename]);
  }
  
  // Delete application
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
  
  // Create download link
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