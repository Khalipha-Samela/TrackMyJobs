import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { applicationService } from '../services/applicationService';
import toast from 'react-hot-toast';
import { 
  FaPlus, 
  FaSignOutAlt, 
  FaEdit, 
  FaTrash, 
  FaFileDownload,
  FaExternalLinkAlt,
  FaLayerGroup,
  FaPaperPlane,
  FaComments,
  FaTimesCircle,
  FaTrophy,
  FaBriefcase,
  FaListAlt,
  FaClipboardList
} from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import Pagination from '../components/Pagination';
import StatusBadge from '../components/StatusBadge';
import DateBadge from '../components/DateBadge';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const [page, setPage] = useState(1);
  const { logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['applications', page],
    queryFn: () => applicationService.getAll(page, 5)
  });

  const deleteMutation = useMutation({
    mutationFn: applicationService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries(['applications']);
      toast.success('Application deleted successfully');
    },
    onError: () => {
      toast.error('Failed to delete application');
    }
  });

  const handleDelete = (id, companyName) => {
    if (window.confirm(`Are you sure you want to delete application for "${companyName}"? This action cannot be undone.`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleDownload = async (id, originalName) => {
    try {
      toast.loading('Downloading CV...', { id: 'download' });
      await applicationService.downloadCV(id);
      toast.success(`Downloaded: ${originalName}`, { id: 'download' });
    } catch (error) {
      toast.error('Failed to download CV', { id: 'download' });
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return bytes + ' bytes';
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="error-message">Error loading applications</div>;

  const applications = data?.data || [];
  const pagination = data?.pagination || {};
  const stats = data?.stats || {};

  return (
    <div className="container">
      <header className="header">
        <h1>
          <FaBriefcase />
          TRACKMYJOBS
        </h1>
        <p>TRACK YOUR JOB SEARCH WITH BOLD, UNAPOLOGETIC CLARITY</p>
      </header>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><FaLayerGroup /></div>
          <div className="stat-number">{stats.total || 0}</div>
          <div className="stat-label">Total Applications</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FaPaperPlane /></div>
          <div className="stat-number">{stats.applied || 0}</div>
          <div className="stat-label">Applied</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FaComments /></div>
          <div className="stat-number">{stats.interview || 0}</div>
          <div className="stat-label">In Interview</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FaTimesCircle /></div>
          <div className="stat-number">{stats.rejected || 0}</div>
          <div className="stat-label">Rejected</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FaTrophy /></div>
          <div className="stat-number">{stats.offer || 0}</div>
          <div className="stat-label">Offers Received</div>
        </div>
      </div>

      {/* Actions */}
      <div className="main-actions">
        <button className="btn btn-primary" onClick={() => navigate('/add')}>
          <FaPlus /> ADD NEW APPLICATION
        </button>
        <button className="btn btn-secondary" onClick={handleLogout}>
          <FaSignOutAlt /> LOGOUT
        </button>
      </div>

      {/* Applications Table */}
      <div className="applications-container">
        <div className="table-header">
          <h2><FaListAlt /> YOUR APPLICATIONS</h2>
          <div className="count-badge">{pagination.total || 0} RECORDS</div>
        </div>

        {applications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FaClipboardList /></div>
            <h3>NO APPLICATIONS FOUND</h3>
            <p>Your job search dashboard is empty. Start tracking your applications to see them here.</p>
            <button className="btn btn-primary" onClick={() => navigate('/add')}>
              <FaPlus /> ADD YOUR FIRST APPLICATION
            </button>
          </div>
        ) : (
          <>
            <div className="applications-table-wrapper">
              <table className="applications-table">
                <thead>
                  <tr>
                    <th>COMPANY & POSITION</th>
                    <th>DATE APPLIED</th>
                    <th>STATUS</th>
                    <th>CV / RESUME</th>
                    <th>NOTES</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app, index) => (
                    <tr key={app.id} style={{ '--row-index': index }}>
                      <td className="company-cell" data-label="Company & Position">
                        <div className="company-name">{app.company_name}</div>
                        <div className="job-title">{app.job_title}</div>
                        {app.job_link && (
                          <a href={app.job_link} target="_blank" rel="noopener noreferrer" className="job-link">
                            <FaExternalLinkAlt /> VIEW JOB POSTING
                          </a>
                        )}
                      </td>
                      <td data-label="Date Applied">
                        <DateBadge date={app.application_date} />
                      </td>
                      <td data-label="Status">
                        <StatusBadge status={app.status} />
                      </td>
                      <td data-label="CV / Resume">
                        {app.cv_filename ? (
                          <div className="cv-container">
                            <button 
                              className="cv-badge"
                              onClick={() => handleDownload(app.id, app.cv_original_name)}
                            >
                              <FaFileDownload />
                              <span>
                                {app.cv_original_name?.length > 20 
                                  ? app.cv_original_name.substring(0, 20) + '...' 
                                  : app.cv_original_name}
                              </span>
                            </button>
                            <div className="cv-size">{app.cv_size ? formatFileSize(app.cv_size) : ''}</div>
                          </div>
                        ) : (
                          <div className="no-cv">
                            <FaTimesCircle /> No CV uploaded
                          </div>
                        )}
                      </td>
                      <td data-label="Notes">
                        <div className="notes-container">
                          {app.notes ? (
                            <>
                              <div>{app.notes.substring(0, 80)}</div>
                              {app.notes.length > 80 && (
                                <button 
                                  className="btn-icon-view"
                                  onClick={() => navigate(`/edit/${app.id}#notes`)}
                                >
                                  VIEW FULL NOTE
                                </button>
                              )}
                            </>
                          ) : (
                            <div className="no-notes">No notes added</div>
                          )}
                        </div>
                      </td>
                      <td data-label="Actions">
                        <div className="action-buttons">
                          <button 
                            className="btn-icon btn-icon-edit"
                            onClick={() => navigate(`/edit/${app.id}`)}
                            title="Edit Application"
                          >
                            <FaEdit />
                          </button>
                          <button 
                            className="btn-icon btn-icon-delete"
                            onClick={() => handleDelete(app.id, app.company_name)}
                            title="Delete Application"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={pagination.totalPages}
                totalItems={pagination.total}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>

      <div className="footer-note">
        <p><strong>TRACK. APPLY. SUCCEED.</strong> • Page {page} of {pagination.totalPages || 1} • {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </div>
    </div>
  );
};

export default Dashboard;