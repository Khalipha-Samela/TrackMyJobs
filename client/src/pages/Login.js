import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import { FaBriefcase, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaRocket } from 'react-icons/fa';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Demo credentials
  const demoCredentials = {
    email: 'demo@trackmyjobs.com',
    password: 'changeme123'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Login successful!');
      navigate('/');
    } catch (error) {
      const message = error.message || 'Login failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      setEmail(demoCredentials.email);
      setPassword(demoCredentials.password);
      await login(demoCredentials.email, demoCredentials.password);
      toast.success('Welcome to TrackMyJobs! 🎉');
      navigate('/');
    } catch (error) {
      const message = error.message || 'Demo login failed';
      toast.error(message);
    } finally {
      setDemoLoading(false);
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
              <span>Sign In</span>
            </div>
          </div>

          <div className="auth-divider"></div>

          {/* Demo Button */}
          <button 
            className="demo-btn" 
            onClick={handleDemoLogin}
            disabled={loading || demoLoading}
          >
            <FaRocket /> {demoLoading ? 'LOGGING IN...' : 'TRY DEMO'}
          </button>

          <div className="demo-divider">
            <span>OR</span>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label className="field-label" htmlFor="email">
                Email
              </label>
              <div className="field-wrap">
                <FaEnvelope className="field-icon" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="field-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  disabled={loading || demoLoading}
                />
              </div>
            </div>

            <div className="field">
              <label className="field-label" htmlFor="password">
                Password
              </label>
              <div className="field-wrap">
                <FaLock className="field-icon" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className="field-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  disabled={loading || demoLoading}
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

            <button type="submit" className="auth-submit" disabled={loading || demoLoading}>
              {loading ? 'SIGNING IN...' : 'SIGN IN'}
            </button>
          </form>

          <div className="auth-footer">
            No account? <Link to="/register">Create one</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;