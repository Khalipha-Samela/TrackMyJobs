import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { 
  FaBriefcase, 
  FaEnvelope, 
  FaLock, 
  FaEye, 
  FaEyeSlash,
  FaIdBadge,
  FaExclamationCircle,
  FaCheckCircle
} from 'react-icons/fa';

const Register = () => {
  const [formData, setFormData] = useState({
    display_name: '',
    email: '',
    password: '',
    password_confirm: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.display_name.trim()) {
      toast.error('Display name is required');
      return false;
    }
    
    if (!formData.email.trim()) {
      toast.error('Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    
    if (!formData.password) {
      toast.error('Password is required');
      return false;
    }
    
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return false;
    }
    
    if (formData.password !== formData.password_confirm) {
      toast.error('Passwords do not match');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await register(formData.email, formData.password, formData.display_name);
      toast.success('Registration successful! Welcome to TrackMyJobs!');
      navigate('/');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card-outer">
        <div className="auth-card">
          <div className="auth-brand">
            <div className="auth-brand-icon">
              <FaBriefcase />
            </div>
            <div className="auth-brand-text">
              <strong>TrackMyJobs</strong>
              <span>Create Account</span>
            </div>
          </div>

          <div className="auth-divider"></div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label className="field-label" htmlFor="display_name">
                Display Name <span className="req">*</span>
              </label>
              <div className="field-wrap">
                <FaIdBadge className="field-icon" />
                <input
                  type="text"
                  id="display_name"
                  name="display_name"
                  className="field-input"
                  value={formData.display_name}
                  onChange={handleInputChange}
                  placeholder="Enter your display name"
                  autoComplete="name"
                  maxLength="100"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="email">
                Email <span className="req">*</span>
              </label>
              <div className="field-wrap">
                <FaEnvelope className="field-icon" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="field-input"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="password">
                Password <span className="req">*</span>
              </label>
              <div className="field-wrap">
                <FaLock className="field-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className="field-input"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a password (min. 8 characters)"
                  autoComplete="new-password"
                  minLength="8"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="pw-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="password_confirm">
                Confirm Password <span className="req">*</span>
              </label>
              <div className="field-wrap">
                <FaLock className="field-icon" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="password_confirm"
                  name="password_confirm"
                  className="field-input"
                  value={formData.password_confirm}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  className="pw-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex="-1"
                >
                  {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              
              {formData.password_confirm && (
                <div className="match-hint">
                  {formData.password === formData.password_confirm ? (
                    <span style={{ color: 'var(--success)' }}>
                      <FaCheckCircle /> Passwords match
                    </span>
                  ) : (
                    <span style={{ color: 'var(--danger)' }}>
                      <FaExclamationCircle /> Passwords do not match
                    </span>
                  )}
                </div>
              )}
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;