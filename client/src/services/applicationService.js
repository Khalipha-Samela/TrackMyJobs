import api from './api';

export const applicationService = {
  /**
   * Get all applications with pagination
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Items per page (default: 5)
   * @returns {Promise} - Returns applications data with pagination and stats
   */
  async getAll(page = 1, limit = 5) {
    try {
      const response = await api.get('/applications', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching applications:', error);
      throw error;
    }
  },

  /**
   * Get a single application by ID
   * @param {number} id - Application ID
   * @returns {Promise} - Returns application data
   */
  async getById(id) {
    try {
      const response = await api.get(`/applications/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching application:', error);
      throw error;
    }
  },

  /**
   * Create a new application with optional CV file
   * @param {Object} data - Application data (company_name, job_title, etc.)
   * @param {File} file - CV file (optional)
   * @returns {Promise} - Returns created application data
   */
  async create(data, file) {
    console.log('📝 Creating application with data:', data);
    console.log('📎 CV File:', file ? file.name : 'No file');
    
    const formData = new FormData();
    
    // Add all form fields - make sure field names match backend expectations
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
        console.log(`  Adding to FormData: ${key} = ${data[key]}`);
        formData.append(key, data[key]);
      }
    });
    
    // Add file if present
    if (file) {
      console.log(`  Adding file to FormData: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(2)} KB)`);
      formData.append('cv_file', file);
    }
    
    // Log all form data entries for debugging
    console.log('📦 FormData entries:');
    for (let pair of formData.entries()) {
      console.log(`   ${pair[0]}: ${pair[1]}`);
    }
    
    try {
      const response = await api.post('/applications', formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('✅ Application created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Create error in service:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Update an existing application
   * @param {number} id - Application ID
   * @param {Object} data - Updated application data
   * @param {File} file - New CV file (optional)
   * @param {boolean} removeCv - Whether to remove existing CV
   * @returns {Promise} - Returns updated application data
   */
  async update(id, data, file, removeCv = false) {
    console.log(`📝 Updating application ${id}:`, data);
    console.log('📎 CV File:', file ? file.name : 'No file');
    console.log('🗑️ Remove CV:', removeCv);
    
    const formData = new FormData();
    
    // Add all form fields
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
        console.log(`  Adding to FormData: ${key} = ${data[key]}`);
        formData.append(key, data[key]);
      }
    });
    
    // Add file if present
    if (file) {
      console.log(`  Adding file to FormData: ${file.name}`);
      formData.append('cv_file', file);
    }
    
    // Add remove CV flag
    if (removeCv) {
      console.log('  Adding remove_cv flag: true');
      formData.append('remove_cv', 'true');
    }

    try {
      const response = await api.put(`/applications/${id}`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data'
        }
      });
      console.log('✅ Application updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Update error in service:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
   * Delete an application and its associated CV file
   * @param {number} id - Application ID
   * @returns {Promise} - Returns success message
   */
  async delete(id) {
    try {
      const response = await api.delete(`/applications/${id}`);
      console.log('Application deleted successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Delete error in service:', error.response?.data || error.message);
      throw error;
    }
  },

  /**
 * Download CV file with original filename
 * @param {number} id - Application ID
 * @returns {Promise} - Returns blob data with original filename
 */
  async downloadCV(id) {
  try {
    console.log(`Downloading CV for application ${id}`);
    
    // Get the token from localStorage
    const token = localStorage.getItem('token');
    
    // Make the request to download the file
    const response = await fetch(`http://localhost:5000/api/applications/${id}/download`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Download failed');
    }
    
    // Get the filename from the Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    console.log('Content-Disposition header:', contentDisposition);
    
    let filename = 'cv.pdf';
    
    if (contentDisposition) {
      // Try to extract filename from UTF-8 encoded version first (filename*=UTF-8'')
      const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/);
      if (utf8Match && utf8Match[1]) {
        filename = decodeURIComponent(utf8Match[1]);
        console.log('Extracted UTF-8 filename:', filename);
      } else {
        // Fallback to regular filename
        const asciiMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (asciiMatch && asciiMatch[1]) {
          filename = asciiMatch[1];
          console.log('Extracted ASCII filename:', filename);
        }
      }
    }
    
    // Get the blob data
    const blob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    console.log(`CV downloaded successfully as: ${filename}`);
    return { success: true, filename };
    
    } catch (error) {
      console.error('Download error in service:', error);
      throw error;
    }
  },

  /**
   * Get application statistics
   * @returns {Promise} - Returns statistics data
   */
  async getStats() {
    try {
      const response = await api.get('/applications/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }
};

export default applicationService;