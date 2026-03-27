const Application = require('../models/Application');
const fs = require('fs').promises;
const path = require('path');
const { validationResult } = require('express-validator');

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
    console.log('\n========== CREATE APPLICATION ==========');
    console.log('User ID:', req.user?.id);
    console.log('Request body:', req.body);
    console.log('File uploaded:', req.file ? req.file.originalname : 'No file');
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
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

    if (req.file) {
      applicationData.cv_filename = req.file.filename;
      applicationData.cv_original_name = req.file.originalname;
      applicationData.cv_mime_type = req.file.mimetype;
      applicationData.cv_size = req.file.size;
    }

    try {
      const id = await Application.create(applicationData, req.user.id);
      const newApplication = await Application.getById(id, req.user.id);
      
      res.status(201).json({
        success: true,
        data: newApplication,
        message: 'Application created successfully'
      });
    } catch (error) {
      console.error('Create error:', error);
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
      }
      res.status(500).json({
        success: false,
        message: 'Error creating application: ' + error.message
      });
    }
  }

  static async update(req, res) {
    const { id } = req.params;
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
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
      
      if (!existingApp) {
        if (req.file) {
          await fs.unlink(req.file.path).catch(console.error);
        }
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }

      const removeCv = req.body.remove_cv === 'true' || req.body.remove_cv === '1';
      
      if (removeCv) {
        applicationData.cv_filename = null;
        applicationData.cv_original_name = null;
        applicationData.cv_mime_type = null;
        applicationData.cv_size = null;
        
        if (existingApp.cv_filename) {
          const oldCvPath = path.join(__dirname, '../uploads/cvs', existingApp.cv_filename);
          await fs.unlink(oldCvPath).catch(console.error);
        }
      }

      if (req.file) {
        applicationData.cv_filename = req.file.filename;
        applicationData.cv_original_name = req.file.originalname;
        applicationData.cv_mime_type = req.file.mimetype;
        applicationData.cv_size = req.file.size;
        
        if (existingApp.cv_filename && !removeCv) {
          const oldCvPath = path.join(__dirname, '../uploads/cvs', existingApp.cv_filename);
          await fs.unlink(oldCvPath).catch(console.error);
        }
      }

      const updated = await Application.update(id, req.user.id, applicationData);
      
      if (!updated) {
        if (req.file) {
          await fs.unlink(req.file.path).catch(console.error);
        }
        return res.status(404).json({
          success: false,
          message: 'Application not found'
        });
      }
      
      const updatedApplication = await Application.getById(id, req.user.id);
      
      res.json({
        success: true,
        data: updatedApplication,
        message: 'Application updated successfully'
      });
    } catch (error) {
      console.error('Update error:', error);
      if (req.file) {
        await fs.unlink(req.file.path).catch(console.error);
      }
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
    const application = await Application.getById(id, req.user.id);
    
    if (!application || !application.cv_filename) {
      return res.status(404).json({
        success: false,
        message: 'CV file not found'
      });
    }
    
    const cvPath = path.join(__dirname, '../uploads/cvs', application.cv_filename);
    
    // Check if file exists
    try {
      await fs.access(cvPath);
    } catch (err) {
      return res.status(404).json({
        success: false,
        message: 'CV file not found on server'
      });
    }
    
    // Get the original filename and clean it for the download
    let originalFileName = application.cv_original_name || 'cv.pdf';
    
    // Remove any path characters and ensure it's safe
    originalFileName = path.basename(originalFileName);
    
    console.log(`📄 Downloading: ${originalFileName}`);
    
    // Set headers - use simple filename for download
    res.setHeader('Content-Type', application.cv_mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${originalFileName}"`);
    res.setHeader('Content-Length', application.cv_size);
    
    // Read and send the file
    const fileBuffer = await fs.readFile(cvPath);
    res.send(fileBuffer);
    
  } catch (error) {
    console.error('Error downloading CV:', error);
    res.status(500).json({
      success: false,
      message: 'Error downloading CV'
    });
  }
}
}

module.exports = ApplicationController;