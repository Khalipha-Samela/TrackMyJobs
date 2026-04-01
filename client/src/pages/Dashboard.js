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
  FaChevronRight
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

  const limit = 10;

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
      // Silent fail - don't log errors to console in production
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
      // Silent fail
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

  const getStatusColor = (status) => {
    switch(status) {
      case 'Applied': return { bg: '#EFF6FF', text: '#1E40AF', dot: '#3B82F6' };
      case 'Interview': return { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' };
      case 'Rejected': return { bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444' };
      case 'Offer': return { bg: '#ECFDF5', text: '#065F46', dot: '#10B981' };
      default: return { bg: '#F3F4F6', text: '#374151', dot: '#6B7280' };
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
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">
              <FaBriefcase />
            </div>
            <div className="logo-text">
              <h1>TrackMyJobs</h1>
              <p>Job Application Tracker</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      </header>

      <div className="welcome-section">
        <h2>Welcome back, {user?.display_name || user?.email?.split('@')[0]}! 👋</h2>
        <p>Track and manage all your job applications in one place</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon"><FaBriefcase /></div>
          <div className="stat-info">
            <h3>{stats.total}</h3>
            <p>Total Applications</p>
          </div>
        </div>
        <div className="stat-card applied">
          <div className="stat-icon"><FaBriefcase /></div>
          <div className="stat-info">
            <h3>{stats.applied}</h3>
            <p>Applied</p>
          </div>
        </div>
        <div className="stat-card interview">
          <div className="stat-icon"><FaCalendarAlt /></div>
          <div className="stat-info">
            <h3>{stats.interview}</h3>
            <p>Interview</p>
          </div>
        </div>
        <div className="stat-card rejected">
          <div className="stat-icon"><FaTimesCircle /></div>
          <div className="stat-info">
            <h3>{stats.rejected}</h3>
            <p>Rejected</p>
          </div>
        </div>
        <div className="stat-card offer">
          <div className="stat-icon"><FaTrophy /></div>
          <div className="stat-info">
            <h3>{stats.offer}</h3>
            <p>Offers</p>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="actions-bar">
        <button className="btn-primary" onClick={() => navigate('/add')}>
          <FaPlus /> Add New Application
        </button>
        
        <div className="filters">
          <div className="search-box">
            <FaSearch />
            <input
              type="text"
              placeholder="Search by company or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            className="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="Applied">Applied</option>
            <option value="Interview">Interview</option>
            <option value="Rejected">Rejected</option>
            <option value="Offer">Offer</option>
          </select>
        </div>
      </div>

      {/* Applications Grid */}
      <div className="applications-grid">
        <div className="grid-header">
          <h3>Your Applications</h3>
          <span>{filteredApplications.length} applications</span>
        </div>
        
        {filteredApplications.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><FaBriefcase /></div>
            <h3>No applications found</h3>
            <p>Start tracking your job applications by adding your first one</p>
            <button className="btn-primary" onClick={() => navigate('/add')}>
              <FaPlus /> Add Application
            </button>
          </div>
        ) : (
          <div className="applications-list">
            {filteredApplications.map((app) => {
              const statusStyle = getStatusColor(app.status);
              return (
                <div key={app.id} className="application-card">
                  <div className="card-header">
                    <div className="company-info">
                      <h4>{app.company_name}</h4>
                      <p>{app.job_title}</p>
                    </div>
                    <div className="status-badge" style={{ background: statusStyle.bg, color: statusStyle.text }}>
                      <span className="status-dot" style={{ background: statusStyle.dot }}></span>
                      {app.status}
                    </div>
                  </div>
                  
                  <div className="card-details">
                    <div className="detail-item">
                      <FaCalendarAlt />
                      <span>Applied: {formatDate(app.application_date)}</span>
                    </div>
                    {app.job_link && (
                      <a href={app.job_link} target="_blank" rel="noopener noreferrer" className="detail-link">
                        <FaExternalLinkAlt />
                        <span>View Job Posting</span>
                      </a>
                    )}
                  </div>
                  
                  {app.notes && (
                    <div className="card-notes">
                      <p>{app.notes.length > 120 ? app.notes.substring(0, 120) + '...' : app.notes}</p>
                    </div>
                  )}
                  
                  <div className="card-actions">
                    {app.cv_filename && (
                      <button 
                        className="action-btn download"
                        onClick={() => handleDownload(app.cv_filename, app.cv_original_name)}
                        title="Download CV"
                      >
                        <FaFileDownload />
                        <span>CV</span>
                      </button>
                    )}
                    <button 
                      className="action-btn edit"
                      onClick={() => navigate(`/edit/${app.id}`)}
                      title="Edit"
                    >
                      <FaEdit />
                      <span>Edit</span>
                    </button>
                    <button 
                      className="action-btn delete"
                      onClick={() => handleDelete(app.id, app.company_name)}
                      title="Delete"
                    >
                      <FaTrash />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button 
              className="page-btn"
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
            >
              <FaChevronLeft /> Previous
            </button>
            <span className="page-info">
              Page {page} of {pagination.totalPages}
            </span>
            <button 
              className="page-btn"
              onClick={() => setPage(page + 1)}
              disabled={page === pagination.totalPages}
            >
              Next <FaChevronRight />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;