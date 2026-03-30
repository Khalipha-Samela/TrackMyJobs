import React, { use, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import useTitle from '../hooks/useTitle';
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
  useTitle('TrackMyJobs - Register');
  const [formData, setFormData] = useState({
    display_name: '',
    email: '',
    password: '',
    password_confirm: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: '',
    color: '#E5E5E5',
    width: '0%'
  });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'password') {
      checkPasswordStrength(value);
    }
  };

  const checkPasswordStrength = (password) => {
    let score = 0;
    let label = '';
    let color = '';
    let width = '0%';
    
    if (!password) {
      setPasswordStrength({ score: 0, label: '', color: '#E5E5E5', width: '0%' });
      return;
    }
    
    // Calculate score
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    // Determine strength level
    if (score <= 1) {
      label = 'WEAK';
      color = '#FF3B30';
      width = '20%';
    } else if (score === 2) {
      label = 'FAIR';
      color = '#FFD166';
      width = '50%';
    } else if (score === 3) {
      label = 'GOOD';
      color = '#118AB2';
      width = '75%';
    } else {
      label = 'STRONG';
      color = '#06D6A0';
      width = '100%';
    }
    
    setPasswordStrength({ score, label, color, width });
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
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.email, // Using email as username
          display_name: formData.display_name,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.password_confirm
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Auto-login after successful registration
        await login(formData.email, formData.password);
        toast.success('Registration successful! Welcome to TrackMyJobs!');
        navigate('/');
      } else {
        toast.error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to connect to server. Please try again.');
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

          <form onSubmit={handleSubmit} id="registerForm" noValidate>
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
                  placeholder="Create a password"
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
              
              {formData.password && (
                <div className="pw-strength visible">
                  <div className="pw-strength-bar">
                    <div 
                      className="pw-strength-fill" 
                      style={{ 
                        width: passwordStrength.width,
                        background: passwordStrength.color
                      }}
                    ></div>
                  </div>
                  <div className="pw-strength-label" style={{ color: passwordStrength.color }}>
                    {passwordStrength.label}
                  </div>
                </div>
              )}
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
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> CREATING ACCOUNT...
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus"></i> CREATE ACCOUNT
                </>
              )}
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