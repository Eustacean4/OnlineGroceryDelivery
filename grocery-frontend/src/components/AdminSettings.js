import React, { useState, useEffect, useCallback } from "react";
import { 
  User, 
  Settings, 
  CreditCard, 
  Bell, 
  Palette, 
  Truck, 
  Shield, 
  Wrench, 
  Database,
  Save,
  Upload,
  Eye,
  EyeOff
} from "lucide-react";
import "./AdminSettings.css";




const AdminSettings = () => {
  const [activeSection, setActiveSection] = useState('account');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [saveStatus, setSaveStatus] = useState({});
  const [phoneError, setPhoneError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePhoneNumber = (phone) => {
    if (!phone || !phone.startsWith('+')) {
      return false;
    }

    // Find matching country code
    const countryCode = Object.keys(COUNTRY_CODES).find(code => phone.startsWith(code));
    
    if (!countryCode) {
      return false;
    }

    const config = COUNTRY_CODES[countryCode];
    const phoneNumber = phone.slice(countryCode.length);
    
    // Check if phone number contains only digits
    if (!/^\d+$/.test(phoneNumber)) {
      return false;
    }

    // Check length constraints
    return phoneNumber.length >= config.minLength && phoneNumber.length <= config.maxLength;
  };

  // Admin Account
  const [adminProfile, setAdminProfile] = useState({
    name: "John Admin",
    email: "admin@grocery.com",
    phone: "+1234567890",
    avatar: null,
    password: "",
    twoFactorAuth: false
  });

  // Platform Settings
  const [platformSettings, setPlatformSettings] = useState({
    cancellationWindow: 30,
    returnPolicy: "Items can be returned within 24 hours of delivery. Refunds will be processed within 3-5 business days.",
    deliveryFeeType: "flat",
    flatFee: 5.99,
    taxRate: 8.5,
    serviceFee: 2.5
  });

  // Payment Gateways
  const [paymentSettings, setPaymentSettings] = useState({
    mode: "sandbox",
    paystackKey: "",
    stripeKey: "",
    flutterwaveKey: "",
    webhookUrl: "https://yourdomain.com/webhook",
    successUrl: "https://yourdomain.com/success",
    failureUrl: "https://yourdomain.com/failure"
  });

  // Notifications
  const [notificationSettings, setNotificationSettings] = useState({
    newUser: true,
    newVendorApp: true,
    failedPayments: true,
    lowStock: true,
    fromName: "Grocery Delivery",
    fromEmail: "noreply@grocery.com",
    smtpHost: "smtp.gmail.com",
    smtpPort: "587",
    smtpUser: "",
    smtpPass: ""
  });

  // Branding
  const [branding, setBranding] = useState({
    logo: null,
    primaryColor: "#4CAF50",
    secondaryColor: "#2196F3",
    appName: "Grocery Delivery"
  });

  // Format phone number as user types
  const formatPhoneNumber = (value) => {
    // Remove all non-digit characters except +
    let cleaned = value.replace(/[^\d+]/g, '');
    
    // Ensure + is only at the beginning
    if (cleaned.includes('+') && !cleaned.startsWith('+')) {
      cleaned = cleaned.replace(/\+/g, '');
      cleaned = '+' + cleaned;
    }

    if (!cleaned.startsWith('+')) {
      return cleaned;
    }

    // Find matching country code
    const countryCode = Object.keys(COUNTRY_CODES).find(code => cleaned.startsWith(code));
    
    if (!countryCode) {
      // If no country code match, limit to reasonable length
      return cleaned.substring(0, 17);
    }

    const config = COUNTRY_CODES[countryCode];
    const phoneNumber = cleaned.slice(countryCode.length);
    
    // Limit the phone number part based on country code
    const maxPhoneLength = config.maxLength;
    const limitedPhoneNumber = phoneNumber.substring(0, maxPhoneLength);
    
    return countryCode + limitedPhoneNumber;
  };

  // Delivery & Riders
  const [deliverySettings, setDeliverySettings] = useState({
    riderAssignment: "nearest",
    performanceThreshold: 80,
    deliveryTimeout: 30,
    maxDeliveryRadius: 25
  });

  // Maintenance
  const [maintenance, setMaintenance] = useState({
    enabled: false,
    message: "We are currently undergoing maintenance. Please check back later.",
    scheduleDate: ""
  });

  // Data Backup
  const [backup, setBackup] = useState({
    lastBackup: "2024-01-15 14:30:00",
    autoBackup: true,
    backupFrequency: "daily"
  });

  const toggleCurrentPassword = useCallback(() => {
    setShowCurrentPassword(prev => !prev);
  }, []);

  const toggleConfirmPassword = useCallback(() => {
    setShowConfirmPassword(prev => !prev);
  }, []);

  const toggleNewPassword = useCallback(() => {
    setShowNewPassword(prev => !prev);
  }, []);

  const getPhoneErrorMessage = (phone) => {
  if (!phone.startsWith('+')) {
    return 'Phone number must start with a country code (e.g., +1, +90, +234)';
  }

  const countryCode = Object.keys(COUNTRY_CODES).find(code => phone.startsWith(code));
  
    if (!countryCode) {
      return 'Unsupported country code. Please use a supported country code.';
    }

    const config = COUNTRY_CODES[countryCode];
    const phoneNumber = phone.slice(countryCode.length);
    
    if (phoneNumber.length < config.minLength) {
      return `${config.name} phone numbers require at least ${config.minLength} digits after country code`;
    }
    
    if (phoneNumber.length > config.maxLength) {
      return `${config.name} phone numbers cannot exceed ${config.maxLength} digits after country code`;
    }

    return 'Please enter a valid phone number';
  };

  const getPhoneHint = (phone) => {
    if (!phone.startsWith('+')) return '';
    
    const countryCode = Object.keys(COUNTRY_CODES).find(code => phone.startsWith(code));
    if (!countryCode) return '';
    
    const config = COUNTRY_CODES[countryCode];
    const phoneNumber = phone.slice(countryCode.length);
    
    return `${config.name} format: ${phoneNumber.length}/${config.maxLength} digits`;
  };

  // Add useEffect to load current user data when component mounts
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) return;

        const response = await fetch('http://localhost:8000/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const userData = data.user;
          setCurrentUser(userData);
          setAdminProfile(prev => ({
            ...prev,
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
          }));
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };
    
    loadUserProfile();
  }, []);

  const sections = [
    { id: 'account', label: 'Account Settings', icon: <User size={18} /> },
    { id: 'platform', label: 'Platform Settings', icon: <Settings size={18} /> },
    { id: 'payment', label: 'Payment Gateway', icon: <CreditCard size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'branding', label: 'Branding', icon: <Palette size={18} /> },
    { id: 'delivery', label: 'Delivery & Riders', icon: <Truck size={18} /> },
    { id: 'security', label: 'Security & Roles', icon: <Shield size={18} /> },
    { id: 'maintenance', label: 'Maintenance', icon: <Wrench size={18} /> },
    { id: 'backup', label: 'Data & Backup', icon: <Database size={18} /> }
  ];

  const handleSave = async (section, data) => {
    setSaveStatus({ [section]: 'saving' });
    
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      if (section === 'account') {
        // Reset errors
        setPhoneError('');
        
        // Validate phone number before sending
        if (data.phone && !validatePhoneNumber(data.phone)) {
          setPhoneError('Please enter a valid phone number with country code (e.g., +1234567890)');
          setSaveStatus({ [section]: 'error' });
          setTimeout(() => setSaveStatus({}), 3000);
          return;
        }

        // Prepare data for profile update
        let updateData = {
          name: data.name,
          phone: data.phone || null,
        };

        // Only include password fields if password is provided
        if (data.password && data.password.trim()) {
          // Add password confirmation validation
          if (data.password !== confirmPassword) {
            setPhoneError('New passwords do not match');
            setSaveStatus({ [section]: 'error' });
            setTimeout(() => setSaveStatus({}), 3000);
            return;
          }
          
          // Add current password requirement
          if (!currentPassword) {
            setPhoneError('Current password is required to set a new password');
            setSaveStatus({ [section]: 'error' });
            setTimeout(() => setSaveStatus({}), 3000);
            return;
          }

          updateData.current_password = currentPassword;
          updateData.password = data.password;
          updateData.password_confirmation = confirmPassword;
        }

        // Use the updateUserById route
        const response = await fetch(`http://localhost:8000/api/users/${currentUser?.id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify(updateData)
        });

        const responseData = await response.json();

        if (!response.ok) {
          // Handle validation errors
          if (response.status === 422 && responseData.errors) {
            const errorMessages = Object.values(responseData.errors).flat();
            throw new Error(errorMessages.join(', '));
          }
          throw new Error(responseData.message || 'Failed to update profile');
        }

        // Update local state with new user data
        setCurrentUser(responseData.user);
        // Clear password fields after successful update
        setAdminProfile(prev => ({
          ...prev,
          name: responseData.user.name || '',
          email: responseData.user.email || '',
          phone: responseData.user.phone || '',
          password: '', // Clear password field
        }));
        setCurrentPassword(''); // Add this
        setConfirmPassword(''); // Add this

        console.log('Profile updated successfully:', responseData);
      } else {
        // Handle other sections (platform, payment, etc.) - simulate API call for now
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`Saving ${section}...`, data);
      }
      
      setSaveStatus({ [section]: 'success' });
      setTimeout(() => setSaveStatus({}), 3000);
    } catch (error) {
      console.error(`Error saving ${section}:`, error);
      setSaveStatus({ [section]: 'error' });
      setTimeout(() => setSaveStatus({}), 3000);
      
      // You can add a toast notification or alert here
      alert(`Error: ${error.message}`);
    }
  };

  const COUNTRY_CODES = {
    '+1': { name: 'US/Canada', minLength: 10, maxLength: 10 }, // +1234567890
    '+44': { name: 'UK', minLength: 10, maxLength: 10 }, // +441234567890
    '+90': { name: 'Turkey', minLength: 10, maxLength: 10 }, // +905336777651
    '+234': { name: 'Nigeria', minLength: 10, maxLength: 10 }, // +2347033654120
    '+91': { name: 'India', minLength: 10, maxLength: 10 }, // +911234567890
    '+86': { name: 'China', minLength: 11, maxLength: 11 }, // +8613812345678
    '+33': { name: 'France', minLength: 9, maxLength: 9 }, // +33123456789
    '+49': { name: 'Germany', minLength: 10, maxLength: 12 }, // +4912345678901
    '+81': { name: 'Japan', minLength: 10, maxLength: 11 }, // +81901234567
    '+61': { name: 'Australia', minLength: 9, maxLength: 9 }, // +61412345678
    // Add more country codes as needed
  };

  const PasswordInput = ({ value, onChange, placeholder, show, toggleShow }) => (
    <div className="password-input">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete="off"
      />
      <button 
        type="button"
        onClick={toggleShow}
        className="password-toggle"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
  

  const renderAccountSettings = () => (
    <div className="settings-content">
      <h3>Account Settings</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>Full Name</label>
          <input
            type="text"
            value={adminProfile.name}
            onChange={(e) => setAdminProfile({ ...adminProfile, name: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email"
            value={adminProfile.email}
            onChange={(e) => setAdminProfile({ ...adminProfile, email: e.target.value })}
            disabled // Email should not be editable in admin settings typically
            className="readonly-input"
          />
        </div>

        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="tel"
            value={adminProfile.phone}
            onChange={(e) => {
              const formattedPhone = formatPhoneNumber(e.target.value);
              setAdminProfile({ ...adminProfile, phone: formattedPhone });
              // Clear phone error when user starts typing
              if (phoneError) setPhoneError('');
            }}
            onBlur={(e) => {
              // Validate on blur
              if (e.target.value && !validatePhoneNumber(e.target.value)) {
                setPhoneError(getPhoneErrorMessage(e.target.value));
              }
            }}
            placeholder="+1234567890, +905336777651, +2347033654120"
            style={{
              borderColor: phoneError ? '#ef4444' : ''
            }}
          />
          {phoneError && (
            <small style={{ 
              color: '#ef4444', 
              fontSize: '12px', 
              marginTop: '4px',
              display: 'block' 
            }}>
              {phoneError}
            </small>
          )}
          {adminProfile.phone && !phoneError && (
            <small style={{ 
              color: '#10b981', 
              fontSize: '12px', 
              marginTop: '4px',
              display: 'block' 
            }}>
              {getPhoneHint(adminProfile.phone)}
            </small>
          )}
        </div>

        <div className="form-group">
          <label>Current Password (required to change password)</label>
          <PasswordInput
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
            show={showCurrentPassword}
            toggleShow={toggleCurrentPassword}
          />
        </div>

        <div className="form-group">
          <label>New Password (leave blank to keep current)</label>
          <PasswordInput
            value={adminProfile.password}
            onChange={(e) => setAdminProfile({ ...adminProfile, password: e.target.value })}
            placeholder="Enter new password"
            show={showNewPassword}
            toggleShow={toggleNewPassword}
          />
        </div>

        <div className="form-group">
          <label>Confirm New Password</label>
          <PasswordInput
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            show={showConfirmPassword}
            toggleShow={toggleConfirmPassword}
          />
        </div>

        <div className="form-group full-width">
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={adminProfile.twoFactorAuth}
                onChange={(e) => setAdminProfile({ ...adminProfile, twoFactorAuth: e.target.checked })}
              />
              <span className="checkmark"></span>
              Enable Two-Factor Authentication
            </label>
          </div>
        </div>
      </div>
      
      <button 
        className="save-btn"
        onClick={() => handleSave("account", adminProfile)}
        disabled={saveStatus.account === 'saving' || phoneError}
      >
        <Save size={16} />
        {saveStatus.account === 'saving' ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );

  const renderPlatformSettings = () => (
    <div className="settings-content">
      <h3>Platform Settings</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>Order Cancellation Window (minutes)</label>
          <input
            type="number"
            value={platformSettings.cancellationWindow}
            onChange={(e) => setPlatformSettings({ ...platformSettings, cancellationWindow: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Delivery Fee Type</label>
          <select
            value={platformSettings.deliveryFeeType}
            onChange={(e) => setPlatformSettings({ ...platformSettings, deliveryFeeType: e.target.value })}
          >
            <option value="flat">Flat Rate</option>
            <option value="distance">Distance Based</option>
          </select>
        </div>

        <div className="form-group">
          <label>Flat Delivery Fee ($)</label>
          <input
            type="number"
            step="0.01"
            value={platformSettings.flatFee}
            onChange={(e) => setPlatformSettings({ ...platformSettings, flatFee: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Tax Rate (%)</label>
          <input
            type="number"
            step="0.1"
            value={platformSettings.taxRate}
            onChange={(e) => setPlatformSettings({ ...platformSettings, taxRate: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Service Fee (%)</label>
          <input
            type="number"
            step="0.1"
            value={platformSettings.serviceFee}
            onChange={(e) => setPlatformSettings({ ...platformSettings, serviceFee: e.target.value })}
          />
        </div>

        <div className="form-group full-width">
          <label>Return/Refund Policy</label>
          <textarea
            rows="4"
            value={platformSettings.returnPolicy}
            onChange={(e) => setPlatformSettings({ ...platformSettings, returnPolicy: e.target.value })}
          />
        </div>
      </div>
      
      <button 
        className="save-btn"
        onClick={() => handleSave("platform", platformSettings)}
        disabled={saveStatus.platform === 'saving'}
      >
        <Save size={16} />
        {saveStatus.platform === 'saving' ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );

  const renderPaymentSettings = () => (
    <div className="settings-content">
      <h3>Payment Gateway Settings</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>Environment Mode</label>
          <select
            value={paymentSettings.mode}
            onChange={(e) => setPaymentSettings({ ...paymentSettings, mode: e.target.value })}
          >
            <option value="sandbox">Sandbox (Testing)</option>
            <option value="production">Production (Live)</option>
          </select>
        </div>

        <div className="form-group">
          <label>Paystack Secret Key</label>
          <input
            type="password"
            placeholder="sk_test_..."
            value={paymentSettings.paystackKey}
            onChange={(e) => setPaymentSettings({ ...paymentSettings, paystackKey: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Stripe Secret Key</label>
          <input
            type="password"
            placeholder="sk_test_..."
            value={paymentSettings.stripeKey}
            onChange={(e) => setPaymentSettings({ ...paymentSettings, stripeKey: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Flutterwave Secret Key</label>
          <input
            type="password"
            placeholder="FLWSECK_TEST-..."
            value={paymentSettings.flutterwaveKey}
            onChange={(e) => setPaymentSettings({ ...paymentSettings, flutterwaveKey: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Webhook URL</label>
          <input
            type="url"
            value={paymentSettings.webhookUrl}
            onChange={(e) => setPaymentSettings({ ...paymentSettings, webhookUrl: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Success Redirect URL</label>
          <input
            type="url"
            value={paymentSettings.successUrl}
            onChange={(e) => setPaymentSettings({ ...paymentSettings, successUrl: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Failure Redirect URL</label>
          <input
            type="url"
            value={paymentSettings.failureUrl}
            onChange={(e) => setPaymentSettings({ ...paymentSettings, failureUrl: e.target.value })}
          />
        </div>
      </div>
      
      <button 
        className="save-btn"
        onClick={() => handleSave("payment", paymentSettings)}
        disabled={saveStatus.payment === 'saving'}
      >
        <Save size={16} />
        {saveStatus.payment === 'saving' ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="settings-content">
      <h3>Notification Settings</h3>
      
      <div className="section-group">
        <h4>Email Notifications</h4>
        <div className="checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={notificationSettings.newUser}
              onChange={(e) => setNotificationSettings({ ...notificationSettings, newUser: e.target.checked })}
            />
            <span className="checkmark"></span>
            New user registration
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={notificationSettings.newVendorApp}
              onChange={(e) => setNotificationSettings({ ...notificationSettings, newVendorApp: e.target.checked })}
            />
            <span className="checkmark"></span>
            New vendor application
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={notificationSettings.failedPayments}
              onChange={(e) => setNotificationSettings({ ...notificationSettings, failedPayments: e.target.checked })}
            />
            <span className="checkmark"></span>
            Failed payments
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={notificationSettings.lowStock}
              onChange={(e) => setNotificationSettings({ ...notificationSettings, lowStock: e.target.checked })}
            />
            <span className="checkmark"></span>
            Low stock alerts
          </label>
        </div>
      </div>

      <div className="section-group">
        <h4>SMTP Configuration</h4>
        <div className="form-grid">
          <div className="form-group">
            <label>From Name</label>
            <input
              type="text"
              value={notificationSettings.fromName}
              onChange={(e) => setNotificationSettings({ ...notificationSettings, fromName: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>From Email</label>
            <input
              type="email"
              value={notificationSettings.fromEmail}
              onChange={(e) => setNotificationSettings({ ...notificationSettings, fromEmail: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>SMTP Host</label>
            <input
              type="text"
              value={notificationSettings.smtpHost}
              onChange={(e) => setNotificationSettings({ ...notificationSettings, smtpHost: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>SMTP Port</label>
            <input
              type="number"
              value={notificationSettings.smtpPort}
              onChange={(e) => setNotificationSettings({ ...notificationSettings, smtpPort: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>SMTP Username</label>
            <input
              type="text"
              value={notificationSettings.smtpUser}
              onChange={(e) => setNotificationSettings({ ...notificationSettings, smtpUser: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>SMTP Password</label>
            <input
              type="password"
              value={notificationSettings.smtpPass}
              onChange={(e) => setNotificationSettings({ ...notificationSettings, smtpPass: e.target.value })}
            />
          </div>
        </div>
      </div>
      
      <button 
        className="save-btn"
        onClick={() => handleSave("notifications", notificationSettings)}
        disabled={saveStatus.notifications === 'saving'}
      >
        <Save size={16} />
        {saveStatus.notifications === 'saving' ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );

  const renderBrandingSettings = () => (
    <div className="settings-content">
      <h3>Branding Settings</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>Application Name</label>
          <input
            type="text"
            value={branding.appName}
            onChange={(e) => setBranding({ ...branding, appName: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Logo Upload</label>
          <div className="logo-upload">
            <div className="logo-preview">
              {branding.logo ? (
                <img src={URL.createObjectURL(branding.logo)} alt="Logo" />
              ) : (
                <div className="logo-placeholder">No Logo</div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setBranding({ ...branding, logo: e.target.files[0] })}
              id="logo-upload"
            />
            <label htmlFor="logo-upload" className="upload-btn">
              <Upload size={16} />
              Upload Logo
            </label>
          </div>
        </div>

        <div className="form-group">
          <label>Primary Color</label>
          <div className="color-input">
            <input
              type="color"
              value={branding.primaryColor}
              onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
            />
            <input
              type="text"
              value={branding.primaryColor}
              onChange={(e) => setBranding({ ...branding, primaryColor: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Secondary Color</label>
          <div className="color-input">
            <input
              type="color"
              value={branding.secondaryColor}
              onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
            />
            <input
              type="text"
              value={branding.secondaryColor}
              onChange={(e) => setBranding({ ...branding, secondaryColor: e.target.value })}
            />
          </div>
        </div>
      </div>
      
      <button 
        className="save-btn"
        onClick={() => handleSave("branding", branding)}
        disabled={saveStatus.branding === 'saving'}
      >
        <Save size={16} />
        {saveStatus.branding === 'saving' ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );

  const renderDeliverySettings = () => (
    <div className="settings-content">
      <h3>Delivery & Rider Settings</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>Rider Assignment Method</label>
          <select
            value={deliverySettings.riderAssignment}
            onChange={(e) => setDeliverySettings({ ...deliverySettings, riderAssignment: e.target.value })}
          >
            <option value="nearest">Nearest Available Rider</option>
            <option value="performance">Best Performance Rating</option>
            <option value="rotation">Round Robin</option>
          </select>
        </div>

        <div className="form-group">
          <label>Performance Threshold (%)</label>
          <input
            type="number"
            min="0"
            max="100"
            value={deliverySettings.performanceThreshold}
            onChange={(e) => setDeliverySettings({ ...deliverySettings, performanceThreshold: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Delivery Timeout (minutes)</label>
          <input
            type="number"
            value={deliverySettings.deliveryTimeout}
            onChange={(e) => setDeliverySettings({ ...deliverySettings, deliveryTimeout: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Maximum Delivery Radius (km)</label>
          <input
            type="number"
            value={deliverySettings.maxDeliveryRadius}
            onChange={(e) => setDeliverySettings({ ...deliverySettings, maxDeliveryRadius: e.target.value })}
          />
        </div>
      </div>
      
      <button 
        className="save-btn"
        onClick={() => handleSave("delivery", deliverySettings)}
        disabled={saveStatus.delivery === 'saving'}
      >
        <Save size={16} />
        {saveStatus.delivery === 'saving' ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );

  const renderMaintenanceSettings = () => (
    <div className="settings-content">
      <h3>Maintenance Mode</h3>
      <div className="form-grid">
        <div className="form-group full-width">
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={maintenance.enabled}
                onChange={(e) => setMaintenance({ ...maintenance, enabled: e.target.checked })}
              />
              <span className="checkmark"></span>
              Enable Maintenance Mode
            </label>
          </div>
        </div>

        <div className="form-group full-width">
          <label>Maintenance Message</label>
          <textarea
            rows="3"
            value={maintenance.message}
            onChange={(e) => setMaintenance({ ...maintenance, message: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Scheduled Maintenance Date</label>
          <input
            type="datetime-local"
            value={maintenance.scheduleDate}
            onChange={(e) => setMaintenance({ ...maintenance, scheduleDate: e.target.value })}
          />
        </div>
      </div>
      
      <button 
        className="save-btn"
        onClick={() => handleSave("maintenance", maintenance)}
        disabled={saveStatus.maintenance === 'saving'}
      >
        <Save size={16} />
        {saveStatus.maintenance === 'saving' ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );

  const renderBackupSettings = () => (
    <div className="settings-content">
      <h3>Data & Backup Settings</h3>
      <div className="form-grid">
        <div className="form-group">
          <label>Last Backup</label>
          <input
            type="text"
            value={backup.lastBackup}
            disabled
            className="readonly-input"
          />
        </div>

        <div className="form-group">
          <label>Backup Frequency</label>
          <select
            value={backup.backupFrequency}
            onChange={(e) => setBackup({ ...backup, backupFrequency: e.target.value })}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        <div className="form-group full-width">
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={backup.autoBackup}
                onChange={(e) => setBackup({ ...backup, autoBackup: e.target.checked })}
              />
              <span className="checkmark"></span>
              Enable Automatic Backup
            </label>
          </div>
        </div>

        <div className="form-group full-width">
          <button className="backup-btn">
            <Database size={16} />
            Create Manual Backup
          </button>
        </div>
      </div>
      
      <button 
        className="save-btn"
        onClick={() => handleSave("backup", backup)}
        disabled={saveStatus.backup === 'saving'}
      >
        <Save size={16} />
        {saveStatus.backup === 'saving' ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="settings-content">
      <h3>Security & Roles</h3>
      <div className="coming-soon">
        <Shield size={48} />
        <h4>Security Settings</h4>
        <p>Advanced security settings and role management coming soon...</p>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'account': return renderAccountSettings();
      case 'platform': return renderPlatformSettings();
      case 'payment': return renderPaymentSettings();
      case 'notifications': return renderNotificationSettings();
      case 'branding': return renderBrandingSettings();
      case 'delivery': return renderDeliverySettings();
      case 'security': return renderSecuritySettings();
      case 'maintenance': return renderMaintenanceSettings();
      case 'backup': return renderBackupSettings();
      default: return renderAccountSettings();
    }
  };

  return (
    <div className="admin-settings">
      <div className="settings-header">
        <h2>Admin Settings</h2>
        <p>Configure your platform settings and preferences</p>
      </div>

      <div className="settings-layout">
        <nav className="settings-sidebar">
          {sections.map(section => (
            <button
              key={section.id}
              className={`settings-nav-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <span className="nav-icon">{section.icon}</span>
              <span className="nav-label">{section.label}</span>
              {saveStatus[section.id] === 'success' && (
                <span className="save-indicator success">✓</span>
              )}
              {saveStatus[section.id] === 'error' && (
                <span className="save-indicator error">✗</span>
              )}
            </button>
          ))}
        </nav>

        <main className="settings-main">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminSettings;