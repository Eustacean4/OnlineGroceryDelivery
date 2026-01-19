import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './ModernAuthStyles.css';
import logo from '../images/logo.png';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    role: '',
    terms: false
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const roles = [
    { value: 'customer', label: 'Customer', icon: '👤', description: 'Shop for groceries' },
    { value: 'vendor', label: 'Vendor', icon: '🏪', description: 'Sell products' },
    // { value: 'rider', label: 'Rider', icon: '🚴', description: 'Deliver orders' },
    // { value: 'admin', label: 'Admin', icon: '👑', description: 'Manage platform' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleRoleSelect = (roleValue) => {
    setForm({ ...form, role: roleValue });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (form.password !== form.password_confirmation) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    if (!form.terms) {
      setError('You must agree to the terms and conditions');
      setLoading(false);
      return;
    }

    if (!form.role) {
      setError('Please select a role');
      setLoading(false);
      return;
    }

    // Validate phone number safely
    if (!form.phone || !isValidPhoneNumber(form.phone)) {
      setError('Invalid phone number');
      setLoading(false);
      return;
    }

    let phoneInfo;
    try {
      phoneInfo = parsePhoneNumber(form.phone);
      console.log('Phone country:', phoneInfo.country);
      console.log('Phone national number:', phoneInfo.nationalNumber);
    } catch (err) {
      console.error('Phone parsing error:', err);
      setError('Invalid phone number format');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const result = await response.json();

      if (response.ok) {
        localStorage.setItem('auth_token', result.token);
        localStorage.setItem('auth_user', JSON.stringify(result.user));

        switch (result.user.role) {
          case 'admin':
            navigate('/admin');
            break;
          case 'vendor':
            navigate('/vendor/dashboard');
            break;
          case 'rider':
            navigate('/dashboard');
            break;
          case 'customer':
          default:
            navigate('/dashboard');
            break;
        }
      } else {
        setError(result.message || 'Registration failed');
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
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
          <div className="tagline">Join the fresh grocery revolution</div>
        </div>

        <div className="auth-body">
          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email address"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <PhoneInput
                country={'tr'} // Turkey is 'tr'
                value={form.phone}
                onChange={(phone) => setForm({ ...form, phone: phone ? `+${phone}` : '' })}
                inputProps={{
                  name: 'phone',
                  required: true
                }}
                inputStyle={{ width: '100%' }}
              />
            </div>

            <div className="form-group password-group">
              <label htmlFor="password">Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  required
                />
                <span
                  className="toggle-eye"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </span>
              </div>
            </div>

            <div className="form-group password-group">
              <label htmlFor="password_confirmation">Confirm Password</label>
              <div className="password-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="password_confirmation"
                  name="password_confirmation"
                  value={form.password_confirmation}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                />
                <span
                  className="toggle-eye"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </span>
              </div>
            </div>

            <div className="form-group">
              <label>Choose Your Role</label>
              <div className="role-grid">
                {roles.map((role) => (
                  <div
                    key={role.value}
                    className={`role-option ${form.role === role.value ? 'selected' : ''}`}
                    onClick={() => handleRoleSelect(role.value)}
                  >
                    <span className="icon">{role.icon}</span>
                    <div className="title">{role.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                id="terms"
                name="terms"
                checked={form.terms}
                onChange={handleChange}
                required
              />
              <label htmlFor="terms">
                I agree to the <a href="#" onClick={(e) => e.preventDefault()}>Terms & Conditions</a> and <a href="#" onClick={(e) => e.preventDefault()}>Privacy Policy</a>
              </label>
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              type="submit"
              className={`auth-button ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <div className="terms">
            Already have an account? <Link to="/login">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
