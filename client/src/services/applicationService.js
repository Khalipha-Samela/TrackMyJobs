import api from './api';

const isDevelopment = process.env.NODE_ENV === 'development';

export const applicationService = {
  async getAll(page = 1, limit = 5) {
    try {
      const response = await api.get('/applications', {
        params: { page, limit }
      });
      return {
        data: response.data.data || [],
        pagination: response.data.pagination || { total: 0, totalPages: 1 },
        stats: response.data.stats || { total: 0, applied: 0, interview: 0, rejected: 0, offer: 0 }
      };
    } catch (error) {
      if (isDevelopment) console.error('Error fetching applications:', error);
      throw error;
    }
  },

  async getById(id) {
    try {
      const response = await api.get(`/applications/${id}`);
      return response.data;
    } catch (error) {
      if (isDevelopment) console.error('Error fetching application:', error);
      throw error;
    }
  },

  async create(data, file) {
    const formData = new FormData();
    
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
        formData.append(key, data[key]);
      }
    });
    
    if (file) {
      formData.append('cv_file', file);
    }
    
    try {
      const response = await api.post('/applications', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      if (isDevelopment) console.error('Create error:', error);
      throw error;
    }
  },

  async update(id, data, file, removeCv = false) {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
        formData.append(key, data[key]);
      }
    });
    if (file) {
      formData.append('cv_file', file);
    }
    if (removeCv) {
      formData.append('remove_cv', 'true');
    }

    try {
      const response = await api.put(`/applications/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      if (isDevelopment) console.error('Update error:', error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const response = await api.delete(`/applications/${id}`);
      return response.data;
    } catch (error) {
      if (isDevelopment) console.error('Delete error:', error);
      throw error;
    }
  },

  async downloadCV(id) {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`https://trackmyjobs-api.onrender.com/api/applications/${id}/download`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Download failed');
      }
      
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'cv.pdf';
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
          try {
            filename = decodeURIComponent(filename);
          } catch (e) {}
        }
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true, filename };
    } catch (error) {
      if (isDevelopment) console.error('Download error:', error);
      throw error;
    }
  }
};