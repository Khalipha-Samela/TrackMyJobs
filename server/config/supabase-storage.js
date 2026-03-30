const supabase = require('./supabase');

async function uploadToSupabase(file, userId) {
  try {
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${userId}_${Date.now()}.${fileExt}`;
    
    console.log('Uploading to Supabase:', fileName);
    console.log('File size:', file.size, 'bytes');
    console.log('File type:', file.mimetype);
    
    const { data, error } = await supabase.storage
      .from('cvs')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }
    
    console.log('Upload successful:', data);
    
    return {
      filename: fileName,
      original_name: file.originalname,
      mime_type: file.mimetype,
      size: file.size
    };
  } catch (error) {
    console.error('Error in uploadToSupabase:', error);
    throw error;
  }
}

async function downloadFromSupabase(filename) {
  try {
    const { data, error } = await supabase.storage
      .from('cvs')
      .download(filename);
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error downloading from Supabase:', error);
    throw error;
  }
}

async function deleteFromSupabase(filename) {
  try {
    const { error } = await supabase.storage
      .from('cvs')
      .remove([filename]);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting from Supabase:', error);
    throw error;
  }
}

module.exports = { uploadToSupabase, downloadFromSupabase, deleteFromSupabase };