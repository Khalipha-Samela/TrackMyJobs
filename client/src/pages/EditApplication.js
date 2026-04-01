import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getApplicationById, updateApplication, deleteApplication, downloadCV } from '../services/supabase';
import toast from 'react-hot-toast';
import { 
  FaArrowLeft, 
  FaSave, 
  FaTimes, 
  FaCloudUploadAlt, 
  FaFilePdf, 
  FaFileWord, 
  FaFile,
  FaEdit,
  FaTrash,
  FaDownload,
  FaInfoCircle,
  FaClipboardCheck,
  FaUndo
} from 'react-icons/fa';
import LoadingSpinner from '../components/LoadingSpinner';

const EditApplication = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '',
    job_title: '',
    job_link: '',
    application_date: '',
    status: 'Applied',
    notes: ''
  });
  const [cvFile, setCvFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [removeCv, setRemoveCv] = useState(false);
  const [existingCv, setExistingCv] = useState(null);

  useEffect(() => {
    fetchApplication();
  }, [id]);

  const fetchApplication = async () => {
    try {
      const app = await getApplicationById(id, user.id);
      
      setFormData({
        company_name: app.company_name,
        job_title: app.job_title,
        job_link: app.job_link || '',
        application_date: app.application_date,
        status: app.status,
        notes: app.notes || ''
      });
      
      if (app.cv_filename) {
        setExistingCv({
          filename: app.cv_filename,
          original_name: app.cv_original_name,
          size: app.cv_size,
          mime_type: app.cv_mime_type
        });
      }
    } catch (error) {
      console.error('Error fetching application:', error);
      toast.error('Failed to load application');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

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
      setRemoveCv(false);
    }
  };

  const removeFile = () => {
    setCvFile(null);
    setFilePreview(null);
    const fileInput = document.getElementById('cv_file');
    if (fileInput) fileInput.value = '';
  };

  const handleRemoveCv = () => {
    setRemoveCv(true);
    setCvFile(null);
    setFilePreview(null);
  };

  const handleDownload = async () => {
    if (!existingCv) return;
    
    try {
      toast.loading('Downloading CV...', { id: 'download' });
      await downloadCV(existingCv.filename, existingCv.original_name);
      toast.success(`Downloaded: ${existingCv.original_name}`, { id: 'download' });
    } catch (error) {
      toast.error('Failed to download CV', { id: 'download' });
    }
  };

  const getFileIcon = (type) => {
    if (type === 'application/pdf') return <FaFilePdf />;
    if (type?.includes('word')) return <FaFileWord />;
    return <FaFile />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return bytes + ' bytes';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.company_name.trim()) {
      toast.error('Company name is required');
      return;
    }
    if (!formData.job_title.trim()) {
      toast.error('Job title is required');
      return;
    }
    if (!formData.application_date) {
      toast.error('Application date is required');
      return;
    }
    
    const submitData = {
      company_name: formData.company_name,
      job_title: formData.job_title,
      job_link: formData.job_link || null,
      application_date: formData.application_date,
      status: formData.status,
      notes: formData.notes || null
    };
    
    setUpdating(true);
    const loadingToast = toast.loading('Updating application...');
    
    try {
      await updateApplication(id, user.id, submitData, cvFile, removeCv);
      toast.success('Application updated successfully!', { id: loadingToast });
      navigate('/');
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error.message || 'Failed to update application', { id: loadingToast });
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete this application? This action cannot be undone.`)) {
      try {
        await deleteApplication(id, user.id);
        toast.success('Application deleted successfully');
        navigate('/');
      } catch (error) {
        toast.error('Failed to delete application');
      }
    }
  };

  const handleReset = () => {
    fetchApplication();
    setCvFile(null);
    setFilePreview(null);
    setRemoveCv(false);
    toast.success('Form reset to original values');
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container">
      <Link to="/" className="back-link">
        <FaArrowLeft /> BACK TO DASHBOARD
      </Link>

      <div className="form-container">
        <div className="form-header">
          <div className="form-header-icon">
            <FaEdit />
          </div>
          <h2>EDIT APPLICATION</h2>
          <p>Update application details</p>
        </div>

        <form onSubmit={handleSubmit}>
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

          {/* CV Section */}
          <div className="form-section">
            <div className="form-section-title">CV / RESUME</div>
            
            {existingCv && !removeCv && (
              <div className="existing-cv">
                <div className="existing-cv-header">
                  <div className="existing-cv-title">
                    {getFileIcon(existingCv.mime_type)}
                    <span>CURRENT CV / RESUME</span>
                  </div>
                  <button type="button" className="btn btn-secondary" onClick={handleDownload}>
                    <FaDownload /> DOWNLOAD
                  </button>
                </div>
                
                <div className="existing-cv-info">
                  <div className="cv-info-item">
                    <div className="cv-info-label">File Name</div>
                    <div className="cv-info-value">{existingCv.original_name}</div>
                  </div>
                  <div className="cv-info-item">
                    <div className="cv-info-label">File Size</div>
                    <div className="cv-info-value">{formatFileSize(existingCv.size)}</div>
                  </div>
                </div>
                
                <button type="button" className="btn btn-danger" onClick={handleRemoveCv}>
                  <FaTrash /> REMOVE THIS CV
                </button>
              </div>
            )}
            
            {(!existingCv || removeCv) && (
              <div className="form-group">
                <label className="form-label">
                  {existingCv ? 'REPLACE CV/RESUME' : 'UPLOAD CV/RESUME'}
                </label>
                
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
                  </ul>
                </div>
              </div>
            )}
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
                placeholder="Add any notes about the application..."
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={updating}>
              <FaSave /> {updating ? 'SAVING...' : 'SAVE CHANGES'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={handleReset}>
              <FaUndo /> RESET FORM
            </button>
            <Link to="/" className="btn btn-secondary">
              <FaTimes /> CANCEL
            </Link>
          </div>
        </form>

        <div className="delete-confirm">
          <h3><FaTrash /> DANGER ZONE</h3>
          <p>This action cannot be undone. This will permanently delete this application.</p>
          <button type="button" className="btn btn-danger" onClick={handleDelete}>
            <FaTrash /> DELETE APPLICATION PERMANENTLY
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditApplication;