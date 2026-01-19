import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaUser, 
  FaBox, 
  FaHeart, 
  FaMapMarkerAlt, 
  FaSignOutAlt,
  FaEye, 
  FaEyeSlash, 
  FaCheck, 
  FaTimes,
  FaCreditCard,
  FaPlus,
  FaQuestionCircle ,
  FaTrash

} from 'react-icons/fa';

// Import CSS Modules
import styles from './MyAccount.module.css';

// Import other components
import Avatar from '../components/Avatar';
import AddressSection from '../components/AddressSection';
import Orders from '../components/Orders';
import WishlistSection from '../components/WishlistSection';
import NotificationModal from '../components/NotificationModal';

/**
 * Password Input Component
 * Using CSS Modules: styles.passwordInputContainer, styles.passwordInput
 */
const PasswordInput = ({ value, onChange, placeholder, show, toggleShow }) => (
  <div className={styles.passwordInputContainer} style={{ position: 'relative' }}>
    <input
      type={show ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete="off"
      className={styles.passwordInput}
    />
    <span
      onClick={toggleShow}
      style={{
        position: 'absolute',
        right: 10,
        top: '50%',
        transform: 'translateY(-50%)',
        cursor: 'pointer',
        userSelect: 'none',
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleShow();
        }
      }}
      aria-label={show ? 'Hide password' : 'Show password'}
    >
      {show ? <FaEyeSlash /> : <FaEye />}
    </span>
  </div>
);


const MyAccount = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarOptions, setShowAvatarOptions] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({
    card_number: '',
    card_holder_name: '',
    expiry_month: '',
    expiry_year: '',
    cvv: '',
    card_type: 'visa'
  });

  const [notification, setNotification] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    showConfirm: false,
    onConfirm: null
  });

  const [tickets, setTickets] = useState([]);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    type: 'general',
    priority: 'medium',
    description: ''
  });


  const userIdRef = useRef(null);

  const location = useLocation();

  useEffect(() => {
    // Handle navigation state for setting active tab
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  const token = localStorage.getItem('auth_token');
  const authUser = JSON.parse(localStorage.getItem('auth_user'));

  // Load user profile data
  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    fetch('http://localhost:8000/api/profile', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })
      .then(async (res) => {
        if (res.status === 401) throw new Error('Session expired. Please log in again.');
        const data = await res.json();
        const userData = data.user;
        setUser(userData);
        setEditName(userData.name || '');
        setEditPhone(userData.phone || '');
        userIdRef.current = userData.id;
      })
      .catch((err) => {
        setError(err.message);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        navigate('/login');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [navigate, token]);

  useEffect(() => {
    if (activeTab === 'support' && token) {
      fetchUserTickets();
    }
  }, [activeTab, token]);

  // Event handlers
  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    navigate('/');
  };

  // Password visibility toggles
  const toggleCurrentPassword = useCallback(() => {
    setShowCurrentPassword(prev => !prev);
  }, []);

  const toggleNewPassword = useCallback(() => {
    setShowNewPassword(prev => !prev);
  }, []);

  const toggleConfirmPassword = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);

  // Save profile changes
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    if (!userIdRef.current) {
      alert("User not loaded yet");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`http://localhost:8000/api/users/${userIdRef.current}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: editName,
          phone: editPhone,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update profile');
      }

      const updatedUser = await res.json();
      setUser(updatedUser);
      setIsEditing(false);
      alert('Profile updated successfully');
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user payment methods
  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/payment-methods', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(Array.isArray(data) ? data : data.data || []);
      } else if (response.status === 401) {
        showNotification('error', 'Session Expired', 'Please log in again');
        navigate('/login');
      } else {
        const errorData = await response.json();
        showNotification('error', 'Error', errorData.message || 'Failed to fetch payment methods');
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      showNotification('error', 'Network Error', 'Unable to connect to server');
    }
  };

  const showNotification = (type, title, message, showConfirm = false, onConfirm = null) => {
    setNotification({
      isOpen: true,
      type,
      title,
      message,
      showConfirm,
      onConfirm
    });
  };

  const formatCardNumber = (value) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Add spaces every 4 digits
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const fetchUserTickets = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/user/tickets', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(Array.isArray(data) ? data : data.data || []);
      } else {
        showNotification('error', 'Error', 'Failed to fetch tickets');
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
      showNotification('error', 'Network Error', 'Unable to connect to server');
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/user/tickets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(newTicket),
      });

      if (response.ok) {
        const createdTicket = await response.json();
        setTickets(prev => [createdTicket, ...prev]);
        setShowCreateTicket(false);
        setNewTicket({
          subject: '',
          type: 'general',
          priority: 'medium',
          description: ''
        });
        showNotification('success', 'Success', 'Your ticket has been submitted successfully!');
      } else {
        const errorData = await response.json();
        showNotification('error', 'Error', errorData.message || 'Failed to create ticket');
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      showNotification('error', 'Network Error', 'Unable to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return '#3b82f6';
      case 'in_progress': return '#f59e0b';
      case 'resolved': return '#10b981';
      case 'closed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };



  // Add new payment method
  const handleAddCard = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Frontend validation
    if (!newCard.card_number.replace(/\s/g, '')) {
      showNotification('error', 'Invalid Input', 'Please enter a valid card number');
      setLoading(false);
      return;
    }

    if (!newCard.card_holder_name.trim()) {
      showNotification('error', 'Invalid Input', 'Please enter the cardholder name');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/api/payment-methods', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          ...newCard,
          card_number: newCard.card_number.replace(/\s/g, '') // Remove spaces
        }),
      });

      if (response.ok) {
        const savedCard = await response.json();
        setPaymentMethods(prev => [...prev, savedCard]);
        setShowAddCard(false);
        setNewCard({
          card_number: '',
          card_holder_name: '',
          expiry_month: '',
          expiry_year: '',
          cvv: '',
          card_type: 'visa'
        });
        showNotification('success', 'Success', 'Card added successfully!');
      } else {
        const errorData = await response.json();
        
        if (errorData.errors) {
          // Handle validation errors
          const errorMessages = Object.values(errorData.errors).flat().join('\n');
          showNotification('error', 'Validation Error', errorMessages);
        } else {
          showNotification('error', 'Error', errorData.message || 'Failed to add card');
        }
      }
    } catch (error) {
      console.error('Error adding card:', error);
      showNotification('error', 'Network Error', 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteCard = async (cardId) => {
    showNotification(
      'warning',
      'Delete Card',
      'Are you sure you want to delete this card? This action cannot be undone.',
      true,
      async () => {
        try {
          const response = await fetch(`http://localhost:8000/api/payment-methods/${cardId}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (response.ok) {
            setPaymentMethods(prev => prev.filter(card => card.id !== cardId));
            showNotification('success', 'Success', 'Card deleted successfully');
          } else {
            const errorData = await response.json();
            showNotification('error', 'Error', errorData.message || 'Failed to delete card');
          }
        } catch (error) {
          console.error('Error deleting card:', error);
          showNotification('error', 'Network Error', 'Unable to connect to server');
        }
      }
    );
  };

  // Updated setDefaultCard function (add this new function)
  const handleSetDefaultCard = async (cardId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/payment-methods/${cardId}/default`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        // Update the payment methods list
        setPaymentMethods(prev => prev.map(card => ({
          ...card,
          is_default: card.id === cardId
        })));
        showNotification('success', 'Success', 'Default payment method updated');
      } else {
        const errorData = await response.json();
        showNotification('error', 'Error', errorData.message || 'Failed to update default payment method');
      }
    } catch (error) {
      console.error('Error setting default card:', error);
      showNotification('error', 'Network Error', 'Unable to connect to server');
    }
  };

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    // Your existing fetch calls...
    fetchPaymentMethods(); // Add this line
  }, [navigate, token]);


  // Change password handler
  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!userIdRef.current) {
      alert("User not loaded yet");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords don't match");
      return;
    }

    if (!token) {
      alert('Session expired. Please log in again.');
      navigate('/login');
      return;
    }

    setIsPasswordLoading(true);

    try {
      const response = await fetch(`http://localhost:8000/api/users/${userIdRef.current}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          password: newPassword,
          password_confirmation: confirmPassword,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        alert(result.message || 'Failed to change password');
      }
    } catch (err) {
      alert('Error changing password.');
    } finally {
      setIsPasswordLoading(false);
    }
  };
  
  // Handle profile picture upload
  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('profile_picture', file);

    try {
      const res = await fetch('http://localhost:8000/api/profile/upload-picture', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setUser(prev => ({ ...prev, profile_picture: data.profile_picture_url }));
        alert('Profile picture updated!');
        setShowAvatarOptions(false);
      } else {
        alert(data.message || 'Upload failed');
      }
    } catch (err) {
      alert('Error uploading');
    }
  };

  // Remove profile picture
  const handleRemovePicture = async () => {
    if (!window.confirm('Are you sure you want to remove your picture?')) return;

    try {
      const res = await fetch('http://localhost:8000/api/profile/remove-picture', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        setUser(prev => ({ ...prev, profile_picture: null }));
        alert('Picture removed');
        setShowAvatarOptions(false);
      } else {
        alert('Failed to remove');
      }
    } catch (err) {
      alert('Error removing picture');
    }
  };

  // Delete account handler
  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account?')) return;

    setIsLoading(true);

    try {
      const response = await fetch(`http://localhost:8000/api/users/${authUser.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        alert('Account deleted successfully');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        navigate('/');
      } else {
        const result = await response.json();
        alert(result.message || 'Failed to delete account');
      }
    } catch (err) {
      alert('Error deleting account.');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading and error states
  if (loading) return <div className={styles.myaccountContainer}>Loading account...</div>;
  if (!user) return null;

  return (
    <div className={styles.myaccountContainer}>
      {/* Sidebar */}
      <aside className={styles.myaccountSidebar}>
        <div className={styles.sidebarHeader}>
          <Avatar profilePicture={user.profile_picture} name={user.name} />
          <div className={styles.sidebarUserInfo}>
            <h4>{user.name}</h4>
            <span className={styles.userEmail}>{user.email}</span>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          <button 
            onClick={() => setActiveTab('profile')} 
            className={`${styles.navItem} ${activeTab === 'profile' ? styles.active : ''}`}
          >
            <FaUser /> Profile
          </button>
          <button 
            onClick={() => setActiveTab('orders')} 
            className={`${styles.navItem} ${activeTab === 'orders' ? styles.active : ''}`}
          >
            <FaBox /> Orders
          </button>
          <button 
            onClick={() => setActiveTab('addresses')} 
            className={`${styles.navItem} ${activeTab === 'addresses' ? styles.active : ''}`}
          >
            <FaMapMarkerAlt /> Addresses
          </button>
          <button 
            onClick={() => setActiveTab('wishlist')} 
            className={`${styles.navItem} ${activeTab === 'wishlist' ? styles.active : ''}`}
          >
            <FaHeart /> Wishlist
          </button>
          <button 
            onClick={() => setActiveTab('payments')} 
            className={`${styles.navItem} ${activeTab === 'payments' ? styles.active : ''}`}
          >
            <FaCreditCard /> Payment Methods
          </button>
          <button 
            onClick={() => setActiveTab('support')} 
            className={`${styles.navItem} ${activeTab === 'support' ? styles.active : ''}`}
          >
            <FaQuestionCircle /> Support
          </button>
        </nav>

        <button onClick={handleLogout} className={styles.logoutBtn}>
          <FaSignOutAlt /> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className={styles.myaccountContent}>
        {activeTab === 'profile' && (
          <div className={styles.tabContent}>
            {/* Profile Header */}
            <div className={styles.profileHeader}>
              <div className={styles.avatarContainer}>
                <Avatar profilePicture={user.profile_picture} name={user.name} />

                <div className={styles.avatarActionWrapper}>
                  {!showAvatarOptions ? (
                    <button
                      className={styles.btnPrimary}
                      onClick={() => setShowAvatarOptions(true)}
                      style={{ fontSize: '14px', padding: '6px 12px' }}
                    >
                      Edit Profile Picture
                    </button>
                  ) : (
                    <div className={styles.avatarOptions}>
                      <label htmlFor="upload-avatar" className={styles.btnPrimary} style={{ cursor: 'pointer' }}>
                        Upload New Picture
                      </label>
                      <input
                        type="file"
                        id="upload-avatar"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleUpload}
                      />
                      <button className={styles.btnDanger} onClick={handleRemovePicture}>
                        Remove Picture
                      </button>
                      <button
                        className={styles.cancelBtn}
                        onClick={() => setShowAvatarOptions(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.profileInfo}>
                <h2>My Profile</h2>
                <p className={styles.profileSubtitle}>Manage your account information</p>
              </div>
            </div>

            {/* Personal Information Form */}
            <div className={styles.formSection}>
              <h3>Personal Information</h3>
              <form className={styles.modernForm} onSubmit={handleSaveChanges}>
                <div className={styles.formGroup}>
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    disabled={!isEditing}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                    className={styles.emailInput}
                  />
                </div>

                {!isEditing && (
                  <button type="button" className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setIsEditing(true)}>
                    Edit Profile
                  </button>
                )}

                {isEditing && (
                  <>
                    <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={isLoading}>
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnDanger}`}
                      onClick={() => {
                        setEditName(user.name || '');
                        setEditPhone(user.phone || '');
                        setIsEditing(false);
                      }}
                      disabled={isLoading}
                      style={{ marginLeft: '10px' }}
                    >
                      Cancel
                    </button>
                  </>
                )}
                {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}
              </form>
            </div>

            {/* Change Password Section */}
            <div className={styles.formSection}>
              <h3>Change Password</h3>
              <form className={styles.modernForm} onSubmit={handlePasswordChange}>
                <div className={styles.formGroup}>
                  <label>Current Password</label>
                  <PasswordInput
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    show={showCurrentPassword}
                    toggleShow={toggleCurrentPassword}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>New Password</label>
                  <PasswordInput
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    show={showNewPassword}
                    toggleShow={toggleNewPassword}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Confirm New Password</label>
                  <PasswordInput
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    show={showConfirmPassword}
                    toggleShow={toggleConfirmPassword}
                  />
                </div>

                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={isPasswordLoading}>
                  {isPasswordLoading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>

            {/* Danger Zone */}
            <div className={`${styles.formSection} ${styles.dangerZone}`}>
              <h3>Danger Zone</h3>
              <p>Once you delete your account, there is no going back. Please be certain.</p>
              <button 
                type="button" 
                onClick={handleDeleteAccount} 
                className={`${styles.btn} ${styles.btnDanger}`} 
                disabled={isLoading}
              >
                {isLoading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        )}

        {/* Other Tab Contents */}
        {activeTab === 'addresses' && <AddressSection token={token} />}
        {activeTab === 'orders' && <Orders token={token} />}
        {activeTab === 'wishlist' && <WishlistSection token={token} />}

        {activeTab === 'payments' && (
          <div className={styles.tabContent}>
            <div className={styles.profileHeader}>
              <div className={styles.profileInfo}>
                <h2>Payment Methods</h2>
                <p className={styles.profileSubtitle}>Manage your saved cards</p>
              </div>
            </div>

            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <h3>Saved Cards</h3>
                <button
                  type="button"
                  onClick={() => setShowAddCard(!showAddCard)}
                  className={`${styles.btn} ${styles.btnPrimary}`}
                >
                  <FaPlus /> Add New Card
                </button>
              </div>

              {paymentMethods.length > 0 ? (
                <div className={styles.addressGrid}>
                  {paymentMethods.map(card => (
                    <div key={card.id} className={`${styles.addressCard} ${card.is_default ? styles.defaultCard : ''}`}>
                      <div className={styles.addressCardHeader}>
                        <div className={styles.addressLabel}>
                          <FaCreditCard className={styles.addressIcon} />
                          <span className={styles.addressLabelText}>
                            {card.card_type?.toUpperCase() || 'CARD'}
                            {card.is_default && <span className={styles.defaultBadge}>DEFAULT</span>}
                          </span>
                        </div>
                      </div>
                      <div className={styles.addressDetails}>
                        <div className={styles.addressStreet}>
                          {card.card_number || `**** **** **** ${card.card_number?.slice(-4) || '****'}`}
                        </div>
                        <div className={styles.addressBuilding}>
                          {card.card_holder_name}
                        </div>
                        <div className={styles.addressCity}>
                          Expires: {card.expiry_month}/{card.expiry_year}
                        </div>
                      </div>
                      <div className={styles.addressActions}>
                        {!card.is_default && (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultCard(card.id)}
                            className={`${styles.btn} ${styles.btnSecondary}`}
                            style={{ fontSize: '12px', padding: '4px 8px' }}
                          >
                            Set Default
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteCard(card.id)}
                          className={`${styles.btn} ${styles.btnDanger}`}
                        >
                          <FaTrash /> Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <FaCreditCard className={styles.emptyIcon} />
                  <h3>No Payment Methods</h3>
                  <p>Add a card to make checkout faster</p>
                </div>
              )}

              {showAddCard && (
                <div className={styles.formSection}>
                  <h3>Add New Card</h3>
                  <form className={styles.modernForm} onSubmit={handleAddCard}>
                    <div className={styles.formGroup}>
                      <label>Card Type</label>
                      <select
                        value={newCard.card_type}
                        onChange={(e) => setNewCard(prev => ({ ...prev, card_type: e.target.value }))}
                        className={styles.customSelect}
                      >
                        <option value="visa">Visa</option>
                        <option value="mastercard">Mastercard</option>
                        <option value="amex">American Express</option>
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Card Number</label>
                      <input
                        type="text"
                        value={newCard.card_number}
                        onChange={(e) => {
                          const formatted = formatCardNumber(e.target.value);
                          if (formatted.replace(/\s/g, '').length <= 19) {
                            setNewCard(prev => ({ ...prev, card_number: formatted }));
                          }
                        }}
                        placeholder="1234 5678 9012 3456"
                        required
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label>Cardholder Name</label>
                      <input
                        type="text"
                        value={newCard.card_holder_name}
                        onChange={(e) => setNewCard(prev => ({ ...prev, card_holder_name: e.target.value }))}
                        placeholder="John Doe"
                        required
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div className={styles.formGroup} style={{ flex: 1 }}>
                        <label>Expiry Month</label>
                        <select
                          value={newCard.expiry_month}
                          onChange={(e) => setNewCard(prev => ({ ...prev, expiry_month: e.target.value }))}
                          className={styles.customSelect}
                          required
                        >
                          <option value="">Month</option>
                          {[...Array(12)].map((_, i) => (
                            <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                              {String(i + 1).padStart(2, '0')} - {new Date(0, i).toLocaleString('default', { month: 'long' })}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className={styles.formGroup} style={{ flex: 1 }}>
                        <label>Expiry Year</label>
                        <select
                          value={newCard.expiry_year}
                          onChange={(e) => setNewCard(prev => ({ ...prev, expiry_year: e.target.value }))}
                          className={styles.customSelect}
                          required
                        >
                          <option value="">Year</option>
                          {[...Array(10)].map((_, i) => {
                            const year = new Date().getFullYear() + i;
                            return (
                              <option key={year} value={year}>
                                {year}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      <div className={styles.formGroup} style={{ flex: 1 }}>
                        <label>CVV</label>
                        <input
                          type="password"
                          value={newCard.cvv}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '');
                            if (value.length <= 4) {
                              setNewCard(prev => ({ ...prev, cvv: value }));
                            }
                          }}
                          placeholder="123"
                          maxLength="4"
                          required
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button
                        type="submit"
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        disabled={loading}
                      >
                        {loading ? 'Adding...' : 'Add Card'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddCard(false);
                          setNewCard({
                            card_number: '',
                            card_holder_name: '',
                            expiry_month: '',
                            expiry_year: '',
                            cvv: '',
                            card_type: 'visa'
                          });
                        }}
                        className={`${styles.btn} ${styles.btnDanger}`}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'support' && (
          <div className={styles.tabContent}>
            <div className={styles.profileHeader}>
              <div className={styles.profileInfo}>
                <h2>Customer Support</h2>
                <p className={styles.profileSubtitle}>
                  Have a complaint or need help? We're here to assist you!
                </p>
              </div>
            </div>

            <div className={styles.formSection}>
              <div className={styles.sectionHeader}>
                <h3>Support Tickets</h3>
                <button
                  type="button"
                  onClick={() => setShowCreateTicket(!showCreateTicket)}
                  className={`${styles.btn} ${styles.btnPrimary}`}
                >
                  <FaPlus /> Create New Ticket
                </button>
              </div>

              {/* Create Ticket Form */}
              {showCreateTicket && (
                <div className={styles.formSection}>
                  <h4>Submit a New Ticket</h4>
                  <form className={styles.modernForm} onSubmit={handleCreateTicket}>
                    <div className={styles.formGroup}>
                      <label>Subject</label>
                      <input
                        type="text"
                        value={newTicket.subject}
                        onChange={(e) => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="Brief description of your issue"
                        required
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div className={styles.formGroup} style={{ flex: 1 }}>
                        <label>Category</label>
                        <select
                          value={newTicket.type}
                          onChange={(e) => setNewTicket(prev => ({ ...prev, type: e.target.value }))}
                          className={styles.customSelect}
                        >
                          <option value="general">General Inquiry</option>
                          <option value="payment">Payment Issue</option>
                          <option value="delivery">Delivery Problem</option>
                          <option value="account">Account Issue</option>
                          <option value="technical">Technical Problem</option>
                          <option value="complaint">Complaint</option>
                          <option value="refund">Refund Request</option>
                        </select>
                      </div>

                      <div className={styles.formGroup} style={{ flex: 1 }}>
                        <label>Priority</label>
                        <select
                          value={newTicket.priority}
                          onChange={(e) => setNewTicket(prev => ({ ...prev, priority: e.target.value }))}
                          className={styles.customSelect}
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label>Description</label>
                      <textarea
                        value={newTicket.description}
                        onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Please provide detailed information about your issue..."
                        rows="5"
                        required
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <button
                        type="submit"
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Submitting...' : 'Submit Ticket'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowCreateTicket(false);
                          setNewTicket({
                            subject: '',
                            type: 'general',
                            priority: 'medium',
                            description: ''
                          });
                        }}
                        className={`${styles.btn} ${styles.btnDanger}`}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Tickets List */}
              <div className={styles.ticketsContainer}>
                {tickets.length === 0 ? (
                  <div className={styles.emptyState}>
                    <FaQuestionCircle className={styles.emptyIcon} />
                    <h3>No Support Tickets</h3>
                    <p>You haven't submitted any support tickets yet. Click "Create New Ticket" to get help with any issues.</p>
                  </div>
                ) : (
                  <div className={styles.ticketsList}>
                    {tickets.map(ticket => (
                      <div key={ticket.id} className={styles.ticketCard}>
                        <div className={styles.ticketHeader}>
                          <div className={styles.ticketTitle}>
                            <h4>#{ticket.id} - {ticket.subject}</h4>
                            <div className={styles.ticketMeta}>
                              <span 
                                className={styles.statusBadge}
                                style={{ backgroundColor: getStatusColor(ticket.status) }}
                              >
                                {ticket.status.replace('_', ' ').toUpperCase()}
                              </span>
                              <span 
                                className={styles.priorityBadge}
                                style={{ backgroundColor: getPriorityColor(ticket.priority) }}
                              >
                                {ticket.priority.toUpperCase()}
                              </span>
                              <span className={styles.typeBadge}>
                                {ticket.type.replace('_', ' ').toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className={styles.ticketDate}>
                            Created: {new Date(ticket.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        
                        <div className={styles.ticketDescription}>
                          {ticket.description}
                        </div>

                        {ticket.admin_response && (
                          <div className={styles.adminResponse}>
                            <strong>Admin Response:</strong>
                            <p>{ticket.admin_response}</p>
                          </div>
                        )}

                        <div className={styles.ticketActions}>
                          <span className={styles.lastUpdate}>
                            Last updated: {new Date(ticket.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Notification Modal */}
        <NotificationModal
          isOpen={notification.isOpen}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          showConfirm={notification.showConfirm}
          onConfirm={notification.onConfirm}
          onClose={() => setNotification(prev => ({ ...prev, isOpen: false }))}
        />
      </main>
    </div>
  );
};

// ES6 Module Export
export default MyAccount;