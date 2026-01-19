import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, useParams } from 'react-router-dom';
import './ModernAuthStyles.css';
import logo from '../images/logo.png'; // Import your logo

export default function ResetPassword() {
  const { token } = useParams(); // ✅ Get token from route
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const emailParam = params.get('email') || '';
  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState('');
  const [password_confirmation, setPasswordConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token || !emailParam) {
      setError('Invalid or expired reset link');
    }
  }, [token, emailParam]);

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    if (!token || !email) {
      setError('Invalid or expired reset link');
      setLoading(false);
      return;
    }

    if (password !== password_confirmation) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token, 
          email, 
          password, 
          password_confirmation 
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('Password reset successful! Redirecting to login...');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(data.message || 'Reset failed.');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Server error. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        <div className="auth-header">
          <div className="logo">
            <img src={logo} alt="Grocery Delivery" className="logo-img" />
          </div>
          <div className="tagline">Create New Password</div>
        </div>

        <div className="auth-body">
          {message && (
            <div className="success-message">
              {message}
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleReset}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email"
                value={email} 
                onChange={(e) => setEmail(e.target.value)} // allow input
                className="editable-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <input 
                type="password" 
                id="password"
                required 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password (min 8 characters)"
                disabled={loading}
                minLength={8}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password_confirmation">Confirm Password</label>
              <input 
                type="password" 
                id="password_confirmation"
                required 
                value={password_confirmation} 
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                placeholder="Confirm new password"
                disabled={loading}
                minLength={8}
              />
            </div>

            <button 
              type="submit" 
              className={`auth-button ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
