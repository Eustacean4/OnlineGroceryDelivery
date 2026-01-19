import React, { useEffect, useState } from 'react';
import styles from './VendorSettings.module.css';

const VendorSettings = ({ token }) => {
  const [vendor, setVendor] = useState({ id: null, name: '', email: '', phone: '' });
  const [originalVendor, setOriginalVendor] = useState({ id: null, name: '', email: '', phone: '' });

  const [passwords, setPasswords] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!token) return;

    setLoading(true);
    fetch('/api/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const { id, name, email, phone } = data.user;
        setVendor({ id, name, email, phone: phone || '' });
        setOriginalVendor({ id, name, email, phone: phone || '' });
      })
      .catch(() => setMessage({ text: 'Failed to load profile.', type: 'error' }))
      .finally(() => setLoading(false));
  }, [token]);

  const handleUpdate = async (e) => {
    e.preventDefault();

    if (passwords.new_password && passwords.new_password !== passwords.confirm_password) {
      setMessage({ text: 'Passwords do not match.', type: 'error' });
      return;
    }

    // Build the update payload
    const updatePayload = {
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone
    };

    // Only add password fields if user is actually updating password
    if (passwords.new_password) {
      updatePayload.current_password = passwords.current_password;
      updatePayload.password = passwords.new_password;
      updatePayload.password_confirmation = passwords.confirm_password;
    }

    try {
      const res = await fetch(`/api/users/${vendor.id}`, {
        method: 'PUT',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatePayload)
      });
      
      const result = await res.json();

      if (!res.ok) {
        const errorMsg = result?.message || 'Update failed.';
        setMessage({ text: errorMsg, type: 'error' });
        return;
      }
      
      setMessage({ text: 'Settings updated successfully!', type: 'success' });
      
      // Update the local state with the response data
      const updatedUser = result.user;
      setVendor({ 
        id: updatedUser.id, 
        name: updatedUser.name, 
        email: updatedUser.email, 
        phone: updatedUser.phone || '' 
      });
      setOriginalVendor({ 
        id: updatedUser.id, 
        name: updatedUser.name, 
        email: updatedUser.email, 
        phone: updatedUser.phone || '' 
      });
      
      setPasswords({ current_password: '', new_password: '', confirm_password: '' });
      setIsEditing(false);
    } catch (err) {
      setMessage({ text: 'Network error. Please try again.', type: 'error' });
    }
  };

  const handleCancel = () => {
    setVendor({ ...originalVendor });
    setPasswords({ current_password: '', new_password: '', confirm_password: '' });
    setIsEditing(false);
    setMessage({ text: '', type: '' });
  };

  return (
    <div className={styles.container}>
      <h2>Vendor Settings</h2>

      {message.text && (
        <div className={`${styles.notification} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <p>Loading...</p>
      ) : (
        <form onSubmit={handleUpdate} className={styles.form}>
          <label>
            Name:
            <input
              type="text"
              value={vendor.name}
              onChange={(e) => setVendor({ ...vendor, name: e.target.value })}
              disabled={!isEditing}
            />
          </label>

          <label>
            Email:
            <input
              type="email"
              value={vendor.email}
              onChange={(e) => setVendor({ ...vendor, email: e.target.value })}
              disabled={!isEditing}
            />
          </label>

          <label>
            Phone:
            <input
              type="text"
              value={vendor.phone}
              onChange={(e) => setVendor({ ...vendor, phone: e.target.value })}
              disabled={!isEditing}
              placeholder="Optional"
            />
          </label>

          <hr className={styles.divider} />

          <h3 className={styles.sectionTitle}>Change Password</h3>

          <label>
            Current Password:
            <div className={styles.passwordWrapper}>
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={passwords.current_password}
                onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })}
                disabled={!isEditing}
                placeholder="Enter current password to change"
              />
              <span
                className={styles.toggleEye}
                onClick={() => setShowPasswords({...showPasswords, current: !showPasswords.current})}
              >
                <i className={`fas ${showPasswords.current ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </span>
            </div>
          </label>

          <label>
            New Password:
            <div className={styles.passwordWrapper}>
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={passwords.new_password}
                onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                disabled={!isEditing}
                placeholder="Leave blank to keep current password"
              />
              <span
                className={styles.toggleEye}
                onClick={() => setShowPasswords({...showPasswords, new: !showPasswords.new})}
              >
                <i className={`fas ${showPasswords.new ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </span>
            </div>
          </label>

          <label>
            Confirm Password:
            <div className={styles.passwordWrapper}>
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwords.confirm_password}
                onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })}
                disabled={!isEditing}
                placeholder="Confirm new password"
              />
              <span
                className={styles.toggleEye}
                onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
              >
                <i className={`fas ${showPasswords.confirm ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </span>
            </div>
          </label>

          {!isEditing ? (
            <button
              type="button"
              className={styles.saveBtn}
              onClick={() => setIsEditing(true)}
            >
              Edit
            </button>
          ) : (
            <div style={{ marginTop: '16px' }}>
                <button type="submit" className={styles.saveBtn}>Save Changes</button>
                <button type="button" onClick={handleCancel} className={styles.cancelBtn}>
                    Cancel
                </button>
            </div>
          )}
        </form>
      )}
    </div>
  );
};

export default VendorSettings;