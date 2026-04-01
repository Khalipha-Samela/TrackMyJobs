import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { 
  FaPlus, 
  FaSignOutAlt, 
  FaEdit, 
  FaTrash, 
  FaFileDownload,
  FaExternalLinkAlt,
  FaBriefcase,
  FaCalendarAlt,
  FaTimesCircle,
  FaTrophy,
  FaSearch,
  FaChevronLeft,
  FaChevronRight,
  FaListAlt,
  FaComments
} from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { 
  getApplications, 
  deleteApplication, 
  downloadCV, 
  getApplicationsStats 
} from '../services/supabase';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const [page, setPage] = useState(1);
  const [applications, setApplications] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    applied: 0,
    interview: 0,
    rejected: 0,
    offer: 0
  });
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const limit = 5; // Number of applications per page

  useEffect(() => {
    if (user) {
      fetchApplications();
      fetchStats();
    }
  }, [user, page]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data, count } = await getApplications(user.id, page, limit);
      setApplications(data || []);
      setPagination({
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      });
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const statsData = await getApplicationsStats(user.id);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleDelete = async (id, companyName) => {
    if (window.confirm(`Delete application for "${companyName}"? This action cannot be undone.`)) {
      try {
        await deleteApplication(id, user.id);
        toast.success('Application deleted successfully');
        fetchApplications();
        fetchStats();
      } catch (error) {
        toast.error('Failed to delete application');
      }
    }
  };

  const handleDownload = async (filename, originalName) => {
    try {
      toast.loading('Downloading CV...', { id: 'download' });
      await downloadCV(filename, originalName);
      toast.success(`Downloaded: ${originalName}`, { id: 'download' });
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download CV', { id: 'download' });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return bytes + ' bytes';
  };

  const getStatusClass = (status) => {
    switch(status) {
      case 'Applied': return 'status-applied';
      case 'Interview': return 'status-interview';
      case 'Rejected': return 'status-rejected';
      case 'Offer': return 'status-offer';
      default: return '';
    }
  };

  // Filter applications based on search and status
  const filteredApplications = applications.filter(app => {
    const matchesSearch = searchTerm === '' || 
      app.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.job_title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container">
      {/* Header */}
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
          <div className="stat-icon"><FaBriefcase /></div>
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Applications</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FaCalendarAlt /></div>
          <div className="stat-number">{stats.applied}</div>
          <div className="stat-label">Applied</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FaComments /></div>
          <div className="stat-number">{stats.interview}</div>
          <div className="stat-label">In Interview</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FaTimesCircle /></div>
          <div className="stat-number">{stats.rejected}</div>
          <div className="stat-label">Rejected</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FaTrophy /></div>
          <div className="stat-number">{stats.offer}</div>
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

      {/* Applications Container */}
      <div className="applications-container">
        <div className="table-header">
          <h2><FaListAlt /> YOUR APPLICATIONS</h2>
          <div className="count-badge">{pagination.total} RECORDS</div>
        </div>

        {filteredApplications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FaBriefcase /></div>
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
                  {filteredApplications.map((app, index) => (
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
                        <div className="date-badge">
                          <span className="date-day">{new Date(app.application_date).getDate()}</span>
                          <span className="date-month">{new Date(app.application_date).toLocaleString('default', { month: 'short', year: 'numeric' })}</span>
                        </div>
                      </td>
                      <td data-label="Status">
                        <span className={`status-badge ${getStatusClass(app.status)}`}>
                          <span className="status-indicator"></span>
                          {app.status}
                        </span>
                      </td>
                      <td data-label="CV / Resume">
                        {app.cv_filename ? (
                          <div className="cv-container">
                            <button 
                              className="cv-badge"
                              onClick={() => handleDownload(app.cv_filename, app.cv_original_name)}
                            >
                              <FaFileDownload />
                              <span>
                                {app.cv_original_name?.length > 20 
                                  ? app.cv_original_name.substring(0, 20) + '...' 
                                  : app.cv_original_name}
                              </span>
                            </button>
                            <div className="cv-size">
                              {app.cv_size ? formatFileSize(app.cv_size) : ''}
                            </div>
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

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="pagination-container">
                <div className="pagination-info">
                  Showing {(page - 1) * limit + 1} - {Math.min(page * limit, pagination.total)} of {pagination.total} applications
                </div>
                <ul className="pagination">
                  <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                    <button 
                      className="page-link"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      <FaChevronLeft /> PREV
                    </button>
                  </li>
                  {[...Array(pagination.totalPages)].map((_, i) => {
                    const pageNum = i + 1;
                    // Show first page, last page, and pages around current page
                    if (
                      pageNum === 1 ||
                      pageNum === pagination.totalPages ||
                      (pageNum >= page - 1 && pageNum <= page + 1)
                    ) {
                      return (
                        <li key={pageNum} className={`page-item ${page === pageNum ? 'active' : ''}`}>
                          <button className="page-link" onClick={() => setPage(pageNum)}>
                            {pageNum}
                          </button>
                        </li>
                      );
                    } else if (
                      (pageNum === 2 && page > 3) ||
                      (pageNum === pagination.totalPages - 1 && page < pagination.totalPages - 2)
                    ) {
                      return <li key={pageNum} className="page-ellipsis">...</li>;
                    }
                    return null;
                  })}
                  <li className={`page-item ${page === pagination.totalPages ? 'disabled' : ''}`}>
                    <button 
                      className="page-link"
                      onClick={() => setPage(page + 1)}
                      disabled={page === pagination.totalPages}
                    >
                      NEXT <FaChevronRight />
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer Note */}
      <div className="footer-note">
        <p><strong>TRACK. APPLY. SUCCEED.</strong> • Page {page} of {pagination.totalPages} • {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </div>
    </div>
  );
};

export default Dashboard;