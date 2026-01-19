import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './ModernAuthStyles.css';
import logo from '../images/logo.png'; // Import your logo

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.message || 'Reset link sent to your email!');
      } else {
        setError(data.message || 'Failed to send reset link.');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Server error. Please try again.');
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
          <div className="tagline">Reset Your Password</div>
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
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                disabled={loading}
              />
            </div>
            
            <button 
              type="submit" 
              className={`auth-button ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="terms">
            Remembered your password? <Link to="/login">Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}