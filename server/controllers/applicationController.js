const Application = require('../models/Application');
const fs = require('fs').promises;
const path = require('path');
const { validationResult } = require('express-validator');
const { uploadToSupabase } = require('../config/supabase-storage');

class ApplicationController {
  static async getAll(req, res) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    try {
      console.log('Fetching applications for user:', req.user.id);
    
      const { data, count } = await Application.getAll(req.user.id, offset, limit);
      const stats = await Application.getStats(req.user.id);
      const total = await Application.count(req.user.id);

      // Ensure data is an array
      const applications = Array.isArray(data) ? data : [];
    
      console.log(`Found ${applications.length} applications out of ${total} total`);
      console.log('First application sample:', applications[0]);

      // Return clean structure - applications array directly
      res.json({
        success: true,
        data: applications,  // Direct array, not nested
        pagination: {
          page,
          limit,
          total: total || 0,
          totalPages: Math.ceil((total || 0) / limit)
        },
        stats: stats || {
          total: 0,
          applied: 0,
          interview: 0,
          rejected: 0,
          offer: 0
        }
      });
    } catch (error) {
      console.error('Error fetching applications:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching applications: ' + error.message,
        data: [],
        pagination: { total: 0, totalPages: 1 },
        stats: { total: 0, applied: 0, interview: 0, rejected: 0, offer: 0 }
      });
    }
  }

  static async getById(req, res) {
    const { id } = req.params;

    try {
      console.log('Fetching application by ID:', id, 'for user:', req.user.id);
    
      const application = await Application.getById(parseInt(id), req.user.id);
    
      if (!application) {
        console.log('Application not found for ID:', id);
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      console.log('Application found:', application.id);
      res.json({
        success: true,
        data: application
      });
    } catch (error) {
      console.error('Error fetching application:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching application: ' + error.message
      });
    }
  }

  static async create(req, res) {
    console.log('========== CREATE APPLICATION ==========');
    console.log('User ID:', req.user?.id);
    console.log('Request body:', req.body);
    console.log('File uploaded:', req.file ? req.file.originalname : 'No file');
  
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const applicationData = {
      company_name: req.body.company_name,
      job_title: req.body.job_title,
      job_link: req.body.job_link || null,
      application_date: req.body.application_date,
      status: req.body.status || 'Applied',
      notes: req.body.notes || null
    };

    // Upload CV to Supabase Storage if file exists
    if (req.file) {
      try {
        console.log('Uploading CV to Supabase...');
        const cvData = await uploadToSupabase(req.file, req.user.id);
        applicationData.cv_filename = cvData.filename;
        applicationData.cv_original_name = cvData.original_name;
        applicationData.cv_mime_type = cvData.mime_type;
        applicationData.cv_size = cvData.size;
        console.log('CV uploaded successfully:', cvData.filename);
      } catch (error) {
        console.error('CV upload error:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload CV: ' + error.message
        });
      }
    }

    try {
      const id = await Application.create(applicationData, req.user.id);
      console.log('Application created with ID:', id);
    
      const newApplication = await Application.getById(id, req.user.id);
    
      res.status(201).json({
        success: true,
        data: newApplication,
        message: 'Application created successfully'
      });
    } catch (error) {
      console.error('Create error:', error);
      res.status(500).json({
        success: false,
        message: 'Error creating application: ' + error.message
      });
    }
  }

  static async update(req, res) {
    const { id } = req.params;
    console.log('========== UPDATE APPLICATION ==========');
    console.log('Application ID:', id);
    console.log('User ID:', req.user?.id);
    console.log('Request body:', req.body);
    console.log('File uploaded:', req.file ? req.file.originalname : 'No file');
  
    // Set timeout for this request
    const timeout = setTimeout(() => {
      console.error('Update operation timed out');
      if (!res.headersSent) {
       res.status(504).json({ 
          success: false, 
          message: 'Request timeout - server took too long to respond' 
        });
      }
    }, 25000);
  
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      clearTimeout(timeout);
      if (req.file) {
        // No file to clean up with memory storage
      }
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const applicationData = {
      company_name: req.body.company_name,
      job_title: req.body.job_title,
      job_link: req.body.job_link || null,
      application_date: req.body.application_date,
      status: req.body.status || 'Applied',
      notes: req.body.notes || null
    };

    try {
      const existingApp = await Application.getById(id, req.user.id);
      console.log('Existing application found:', existingApp ? 'Yes' : 'No');
    
      if (!existingApp) {
        clearTimeout(timeout);
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      const removeCv = req.body.remove_cv === 'true' || req.body.remove_cv === '1';
      console.log('Remove CV flag:', removeCv);
    
      if (removeCv) {
        applicationData.cv_filename = null;
        applicationData.cv_original_name = null;
        applicationData.cv_mime_type = null;
        applicationData.cv_size = null;
      
        // Delete from Supabase Storage if exists
        if (existingApp.cv_filename) {
          try {
            const { deleteFromSupabase } = require('../config/supabase-storage');
            await deleteFromSupabase(existingApp.cv_filename);
            console.log('Deleted CV from Supabase:', existingApp.cv_filename);
          } catch (err) {
            console.error('Error deleting from Supabase:', err);
          }
        }
      }

      // Handle new CV upload
      if (req.file) {
        try {
          const { uploadToSupabase } = require('../config/supabase-storage');
          const cvData = await uploadToSupabase(req.file, req.user.id);
          applicationData.cv_filename = cvData.filename;
          applicationData.cv_original_name = cvData.original_name;
          applicationData.cv_mime_type = cvData.mime_type;
          applicationData.cv_size = cvData.size;
          console.log('New CV uploaded:', cvData.filename);
        
          // Delete old CV if exists
          if (existingApp.cv_filename && !removeCv) {
            const { deleteFromSupabase } = require('../config/supabase-storage');
            await deleteFromSupabase(existingApp.cv_filename);
            console.log('Deleted old CV:', existingApp.cv_filename);
          }
        } catch (error) {
          console.error('CV upload error:', error);
          clearTimeout(timeout);
          return res.status(500).json({
            success: false,
            message: 'Failed to upload CV: ' + error.message
          });
        }
      }

      const updated = await Application.update(id, req.user.id, applicationData);
      console.log('Update result:', updated);
    
      if (!updated) {
        clearTimeout(timeout);
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }
    
      const updatedApplication = await Application.getById(id, req.user.id);
    
      clearTimeout(timeout);
      res.json({
        success: true,
        data: updatedApplication,
        message: 'Application updated successfully'
      });
    } catch (error) {
      console.error('Update error:', error);
      clearTimeout(timeout);
      res.status(500).json({
        success: false,
        message: 'Error updating application: ' + error.message
      });
    }
  }

  static async delete(req, res) {
    const { id } = req.params;

    try {
      const result = await Application.delete(id, req.user.id);
      
      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }
      
      if (result.cvFilename) {
        const cvPath = path.join(__dirname, '../uploads/cvs', result.cvFilename);
        await fs.unlink(cvPath).catch(console.error);
      }
      
      res.json({
        success: true,
        message: 'Application deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting application:', error);
      res.status(500).json({
        success: false,
        message: 'Error deleting application'
      });
    }
  }

  static async downloadCV(req, res) {
    const { id } = req.params;

    try {
      console.log('Download CV request for application ID:', id);
    
      const application = await Application.getById(id, req.user.id);
    
      if (!application || !application.cv_filename) {
        return res.status(404).json({
          success: false,
          message: 'CV file not found'
        });
      }

      // Download from Supabase Storage
      const fileBuffer = await downloadFromSupabase(application.cv_filename);
    
      const originalFileName = application.cv_original_name || 'cv.pdf';
    
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalFileName)}"`);
      res.setHeader('Content-Type', application.cv_mime_type || 'application/octet-stream');
      res.setHeader('Content-Length', fileBuffer.length);
    
      res.send(fileBuffer);
    
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({
        success: false,
        message: 'Error downloading CV: ' + error.message
      });
    }
  }
}

module.exports = ApplicationController;