import React, { use, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { applicationService } from '../services/applicationService';
import toast from 'react-hot-toast';
import { 
  FaArrowLeft, 
  FaSave, 
  FaTimes, 
  FaCloudUploadAlt, 
  FaFilePdf, 
  FaFileWord, 
  FaFile,
  FaPlus,
  FaInfoCircle,
  FaClipboardCheck
} from 'react-icons/fa';

const AddApplication = () => {
  useTitle('TrackMyJobs - Add Application');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    company_name: '',
    job_title: '',
    job_link: '',
    application_date: new Date().toISOString().split('T')[0],
    status: 'Applied',
    notes: ''
  });
  const [cvFile, setCvFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  const mutation = useMutation({
    mutationFn: (data) => applicationService.create(data.formData, data.file),
    onSuccess: () => {
      queryClient.invalidateQueries(['applications']);
      toast.success('Application added successfully!');
      navigate('/');
    },
    onError: (error) => {
      const message = error.response?.data?.message || 'Failed to add application';
      toast.error(message);
    }
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File is too large. Maximum size is 5MB.');
        return;
      }
      
      const allowedTypes = ['application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Only PDF, DOC, and DOCX files are allowed.');
        return;
      }
      
      setCvFile(file);
      setFilePreview({
        name: file.name,
        size: file.size,
        type: file.type
      });
    }
  };

  const removeFile = () => {
    setCvFile(null);
    setFilePreview(null);
    const fileInput = document.getElementById('cv_file');
    if (fileInput) fileInput.value = '';
  };

  const getFileIcon = (type) => {
    if (type === 'application/pdf') return <FaFilePdf />;
    if (type?.includes('word')) return <FaFileWord />;
    return <FaFile />;
  };

  const formatFileSize = (bytes) => {
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return bytes + ' bytes';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const submitData = {
      company_name: formData.company_name,
      job_title: formData.job_title,
      job_link: formData.job_link || null,
      application_date: formData.application_date,
      status: formData.status,
      notes: formData.notes || null
    };

    try {
      await applicationService.create(submitData, cvFile);
      toast.success('Application added!');
      navigate('/');
    } catch (error) {
      toast.error('Failed to add application');
    }
  };

  return (
    <div className="container">
      <Link to="/" className="back-link">
        <FaArrowLeft /> BACK TO DASHBOARD
      </Link>

      <div className="form-container">
        <div className="form-header">
          <div className="form-header-icon">
            <FaPlus />
          </div>
          <h2>ADD NEW APPLICATION</h2>
          <p>TRACK A NEW JOB APPLICATION WITH CV/RESUME</p>
        </div>

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          {/* Company & Position Section */}
          <div className="form-section">
            <div className="form-section-title">COMPANY & POSITION</div>
            
            <div className="form-group">
              <label className="form-label">
                COMPANY NAME <span className="required">*</span>
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                placeholder="e.g., TECH CORP INC."
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                JOB TITLE <span className="required">*</span>
              </label>
              <input
                type="text"
                name="job_title"
                value={formData.job_title}
                onChange={handleInputChange}
                placeholder="e.g., SENIOR FULL-STACK DEVELOPER"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">JOB LINK (URL)</label>
              <input
                type="url"
                name="job_link"
                value={formData.job_link}
                onChange={handleInputChange}
                placeholder="https://company.com/careers/job-id"
              />
            </div>
          </div>

          {/* Application Details Section */}
          <div className="form-section">
            <div className="form-section-title">APPLICATION DETAILS</div>
            
            <div className="form-group">
              <label className="form-label">
                APPLICATION DATE <span className="required">*</span>
              </label>
              <input
                type="date"
                name="application_date"
                value={formData.application_date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">STATUS</label>
              <select name="status" value={formData.status} onChange={handleInputChange}>
                <option value="Applied">APPLIED</option>
                <option value="Interview">INTERVIEW</option>
                <option value="Rejected">REJECTED</option>
                <option value="Offer">OFFER</option>
              </select>
            </div>
          </div>

          {/* CV Upload Section */}
          <div className="form-section">
            <div className="form-section-title">CV / RESUME</div>
            
            <div className="form-group">
              <label className="form-label">UPLOAD CV/RESUME</label>
              
              <div className="file-upload-container">
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    id="cv_file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                  />
                  <div className="file-input-label">
                    <FaCloudUploadAlt />
                    <span>CHOOSE CV/RESUME FILE</span>
                  </div>
                </div>

                {filePreview && (
                  <div className="file-preview active">
                    <div className="file-info">
                      <div className="file-icon">{getFileIcon(filePreview.type)}</div>
                      <div className="file-details">
                        <div className="file-name">{filePreview.name}</div>
                        <div className="file-size">{formatFileSize(filePreview.size)}</div>
                      </div>
                      <button type="button" className="remove-file" onClick={removeFile}>
                        <FaTimes /> REMOVE
                      </button>
                    </div>
                  </div>
                )}

                <div className="upload-hint">
                  <FaInfoCircle /> Click to browse or drag and drop your file
                </div>
              </div>

              <div className="file-requirements">
                <h4><FaClipboardCheck /> FILE REQUIREMENTS:</h4>
                <ul>
                  <li>Accepted formats: PDF, DOC, DOCX</li>
                  <li>Maximum file size: 5 MB</li>
                  <li>Name your file appropriately (e.g., John_Doe_CV.pdf)</li>
                  <li>Ensure your contact information is up to date</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="form-section">
            <div className="form-section-title">NOTES & COMMENTS</div>
            
            <div className="form-group">
              <label className="form-label">NOTES</label>
              <textarea
                name="notes"
                rows="6"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Add any notes about the application, contact person, follow-up dates, salary discussions, technical requirements, etc."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={mutation.isLoading}>
              <FaSave /> {mutation.isLoading ? 'SAVING...' : 'SAVE APPLICATION'}
            </button>
            <Link to="/" className="btn btn-secondary">
              <FaTimes /> CANCEL
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddApplication;