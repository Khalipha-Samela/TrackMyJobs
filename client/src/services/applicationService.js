import api from './api';

export const applicationService = {
   async getAll(page = 1, limit = 5) {
    try {
      console.log('Fetching applications for page:', page);
      const response = await api.get('/applications', {
        params: { page, limit }
      });
      console.log('Raw API response:', response.data);
      
      let applications = [];
      let pagination = { total: 0, totalPages: 1 };
      let stats = { total: 0, applied: 0, interview: 0, rejected: 0, offer: 0 };
      
      if (response.data) {
        // The applications array might be in different places depending on backend response
        if (response.data.data && Array.isArray(response.data.data)) {
          // Case 1: data is directly an array
          applications = response.data.data;
        } else if (response.data.data && response.data.data.data && Array.isArray(response.data.data.data)) {
          // Case 2: data has nested data array (from your backend)
          applications = response.data.data.data;
        } else if (Array.isArray(response.data.data)) {
          applications = response.data.data;
        }
        
        // Extract pagination
        if (response.data.pagination) {
          pagination = response.data.pagination;
        }
        
        // Extract stats
        if (response.data.stats) {
          stats = response.data.stats;
        }
      }
      
      console.log('Extracted applications array:', applications);
      console.log('Applications count:', applications.length);
      
      return {
        data: applications,
        pagination: pagination,
        stats: stats
      };
    } catch (error) {
      console.error('Error fetching applications:', error);
      throw error;
    }
  },

  async getById(id) {
    try {
      const response = await api.get(`/applications/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching application:', error);
      throw error;
    }
  },

  async create(data, file) {
    console.log('Creating application with data:', data);
    console.log('CV File:', file ? file.name : 'No file');
  
    const formData = new FormData();
  
    // Add all form fields
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
        formData.append(key, data[key]);
      }
    });
  
    // Add file if present
    if (file) {
      formData.append('cv_file', file);
    }
  
    try {
      const token = localStorage.getItem('token');
    
      // Create an AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
      const response = await fetch('https://trackmyjobs-api.onrender.com/api/applications', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
        signal: controller.signal
      });
    
      clearTimeout(timeoutId);
    
      const responseData = await response.json();
    
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to create application');
      }
    
      console.log('✅ Application created successfully:', responseData);
      return responseData;
    } catch (error) {
      console.error('❌ Create error:', error);
      if (error.name === 'AbortError') {
        throw new Error('Request timeout - file may be too large or server is slow');
      }
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
      console.error('Update error:', error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const response = await api.delete(`/applications/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete error:', error);
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
      console.error('Download error:', error);
      throw error;
    }
  }
};

export default applicationService;