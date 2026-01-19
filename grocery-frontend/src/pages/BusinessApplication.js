import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Upload,
  Check,
  AlertCircle,
  FileText,
  Camera,
  User,
  Shield,
  MapPin,
  ChevronDown
} from 'lucide-react';
import styles from './BusinessApplication.module.css';

const BusinessApplication = ({ onBack, onComplete, applicationToEdit }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
   
  console.log('Component rendering, currentStep:', currentStep);

  const [formData, setFormData] = useState({
    // Basic business information
    businessName: '',
    businessEmail: '',
    phoneNumber: '',
    countryCode: '+90',
    businessAddress: '',
    businessLogo: null,
    
    // Required documents
    businessLicense: null,
    taxCertificate: null,
    ownerIdDocument: null,
    healthSafetyCert: null, // optional
    addressProof: null,
    storefrontPhotos: [] // required, min 2, max 5
  });

  useEffect(() => {
    if (applicationToEdit) {
      setFormData(prev => ({
        ...prev,
        businessName: applicationToEdit.businessName || applicationToEdit.name || '',
        businessEmail: applicationToEdit.businessEmail || applicationToEdit.email || '',
        phoneNumber: applicationToEdit.phoneNumber || applicationToEdit.phone || '',
        countryCode: applicationToEdit.countryCode || '+90',
        businessAddress: applicationToEdit.businessAddress || applicationToEdit.address || '',
        // You can add other fields here if needed
      }));
    }
  }, [applicationToEdit]);

  const fileInputRefs = {
    businessLogo: useRef(null),
    businessLicense: useRef(null),
    taxCertificate: useRef(null),
    ownerIdDocument: useRef(null),
    healthSafetyCert: useRef(null),
    addressProof: useRef(null),
    storefrontPhotos: useRef(null)
  };

  // --- Validation ---
  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.businessName.trim()) newErrors.businessName = 'Business name is required';
        if (!formData.businessEmail.trim()) newErrors.businessEmail = 'Business email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.businessEmail)) newErrors.businessEmail = 'Invalid email format';
        if (!formData.countryCode) newErrors.countryCode = 'Country code is required';
        if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
        if (!formData.businessAddress.trim()) newErrors.businessAddress = 'Business address is required';
        break;

      case 2:
        if (!formData.businessLicense) newErrors.businessLicense = 'Business license is required';
        if (!formData.taxCertificate) newErrors.taxCertificate = 'Tax certificate is required';
        if (!formData.ownerIdDocument) newErrors.ownerIdDocument = 'Owner ID document is required';
        if (!formData.addressProof) newErrors.addressProof = 'Address proof is required';
        break;

      case 3:
        if (!formData.storefrontPhotos || formData.storefrontPhotos.length < 2) {
          newErrors.storefrontPhotos = 'At least 2 storefront photos are required';
        }
        if (formData.storefrontPhotos && formData.storefrontPhotos.length > 5) {
          newErrors.storefrontPhotos = 'Maximum 5 storefront photos allowed';
        }
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // Updated countries with better flag support using Unicode flag sequences
  const countries = [
    { code: '+90', name: 'Turkey', flag: '🇹🇷', iso: 'TR' },
    { code: '+1', name: 'United States', flag: '🇺🇸', iso: 'US' },
    { code: '+44', name: 'United Kingdom', flag: '🇬🇧', iso: 'GB' },
    { code: '+49', name: 'Germany', flag: '🇩🇪', iso: 'DE' },
    { code: '+33', name: 'France', flag: '🇫🇷', iso: 'FR' },
    { code: '+39', name: 'Italy', flag: '🇮🇹', iso: 'IT' },
    { code: '+34', name: 'Spain', flag: '🇪🇸', iso: 'ES' },
    { code: '+31', name: 'Netherlands', flag: '🇳🇱', iso: 'NL' },
    { code: '+32', name: 'Belgium', flag: '🇧🇪', iso: 'BE' },
    { code: '+41', name: 'Switzerland', flag: '🇨🇭', iso: 'CH' },
    { code: '+43', name: 'Austria', flag: '🇦🇹', iso: 'AT' },
    { code: '+45', name: 'Denmark', flag: '🇩🇰', iso: 'DK' },
    { code: '+46', name: 'Sweden', flag: '🇸🇪', iso: 'SE' },
    { code: '+47', name: 'Norway', flag: '🇳🇴', iso: 'NO' },
    { code: '+358', name: 'Finland', flag: '🇫🇮', iso: 'FI' },
    { code: '+91', name: 'India', flag: '🇮🇳', iso: 'IN' },
    { code: '+86', name: 'China', flag: '🇨🇳', iso: 'CN' },
    { code: '+81', name: 'Japan', flag: '🇯🇵', iso: 'JP' },
    { code: '+82', name: 'South Korea', flag: '🇰🇷', iso: 'KR' },
    { code: '+61', name: 'Australia', flag: '🇦🇺', iso: 'AU' },
    { code: '+55', name: 'Brazil', flag: '🇧🇷', iso: 'BR' },
    { code: '+52', name: 'Mexico', flag: '🇲🇽', iso: 'MX' },
    { code: '+7', name: 'Russia', flag: '🇷🇺', iso: 'RU' },
    { code: '+971', name: 'UAE', flag: '🇦🇪', iso: 'AE' },
    { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦', iso: 'SA' }
  ];

  // Enhanced flag display component with better fallback
  const FlagDisplay = ({ country }) => {
    const [flagError, setFlagError] = useState(false);
    
    // Check if the browser supports emoji flags
    const supportsEmoji = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font = '16px Arial';
      
      // Test with a known emoji
      ctx.fillText('🇺🇸', 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // If the emoji is supported, it should have some non-zero pixels
      return imageData.data.some(pixel => pixel !== 0);
    };

    // If emoji is not supported or there's an error, show fallback
    if (flagError || !supportsEmoji()) {
      return (
        <span className={styles['country-flag-fallback']}>
          {country.iso}
        </span>
      );
    }
    
    return (
      <span 
        className={styles['country-flag']}
        style={{
          fontFamily: '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", "Android Emoji", "EmojiSymbols", sans-serif',
          fontSize: '18px',
          lineHeight: '1',
          fontVariantEmoji: 'emoji'
        }}
        role="img"
        aria-label={`${country.name} flag`}
        onError={() => setFlagError(true)}
      >
        {country.flag}
      </span>
    );
  };

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    country.code.includes(countrySearch)
  );

  const selectedCountry = countries.find(c => c.code === formData.countryCode);

  // --- Input Handlers ---
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleFileUpload = (field, file) => {
    if (field === 'storefrontPhotos') {
      const newPhotos = Array.from(file);
      setFormData(prev => ({
        ...prev,
        storefrontPhotos: [...prev.storefrontPhotos, ...newPhotos].slice(0, 5) // max 5 photos
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: file }));
    }
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const removeStorefrontPhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      storefrontPhotos: prev.storefrontPhotos.filter((_, i) => i !== index)
    }));
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  // --- Submit ---
  // Updated handleSubmit function for BusinessApplication.js
  // Updated handleSubmit function for BusinessApplication.js
  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const formDataToSubmit = new FormData();

      // Basic information
      formDataToSubmit.append('name', formData.businessName);
      formDataToSubmit.append('email', formData.businessEmail);
      formDataToSubmit.append('phone', `${formData.countryCode}${formData.phoneNumber}`);
      formDataToSubmit.append('address', formData.businessAddress);
      
      // Logo (optional)
      if (formData.businessLogo) {
        formDataToSubmit.append('logo', formData.businessLogo);
      }
      
      // Required documents
      formDataToSubmit.append('business_license', formData.businessLicense);
      formDataToSubmit.append('tax_certificate', formData.taxCertificate);
      formDataToSubmit.append('owner_id_document', formData.ownerIdDocument);
      formDataToSubmit.append('address_proof', formData.addressProof);
      
      // Optional health certificate
      if (formData.healthSafetyCert) {
        formDataToSubmit.append('health_safety_cert', formData.healthSafetyCert);
      }

      // Handle storefront photos
      formData.storefrontPhotos.forEach((photo, index) => {
        formDataToSubmit.append('storefront_photos[]', photo);
      });

      // Debug: Log what we're sending
      console.log('FormData contents:');
      for (let [key, value] of formDataToSubmit.entries()) {
        console.log(key, value);
      }

      const response = await fetch('/api/business-applications', {
        method: 'POST',
        body: formDataToSubmit,
        headers: { 
          Authorization: `Bearer ${localStorage.getItem('auth_token')}` 
          // Don't set Content-Type header - let browser set it with boundary
        }
      });

      // Log the raw response for debugging
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);
      
      const responseText = await response.text();
      console.log('Raw response:', responseText);

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response as JSON:', parseError);
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        console.error('Response not ok:', result);
        
        // Handle validation errors specifically
        if (result.errors) {
          const errorMessages = Object.values(result.errors).flat();
          setSubmitError(`Validation failed: ${errorMessages.join(', ')}`);
        } else {
          setSubmitError(result.message || 'Submission failed. Please try again.');
        }
        return;
      }

      // Success! Move to step 4
      console.log('Submission successful:', result);
      console.log('About to set step to 4');
      setCurrentStep(4);
      console.log('Step set to 4, current state:', currentStep);    
      
      // Call onComplete callback if provided
     //if (onComplete) {
     //   setTimeout(() => onComplete(result), 2000);
     // }

    } catch (error) {
      console.error('Submit error:', error);
      setSubmitError(error.message || 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Step Renderers ---
  const renderStepIndicator = () => (
    <div className={styles['step-indicator']}>
      {[1, 2, 3].map((step, index) => (
        <React.Fragment key={step}>
          <div
            className={`${styles['step-circle']} ${
              currentStep >= step ? styles.active : ''
            }`}
          >
            {currentStep > step ? <Check size={16} /> : step}
          </div>
          {index < 2 && (
            <div
              className={`${styles['step-line']} ${
                currentStep > step ? styles.active : ''
              }`}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderFileUpload = (field, label, accept = 'image/*', required = false, icon = FileText) => {
    const IconComponent = icon;
    return (
      <div className={styles['form-group']}>
        <label className={styles.label}>
          {label} {required && <span className={styles.required}>*</span>}
        </label>
        <div
          className={`${styles['file-drop-zone']} ${errors[field] ? styles.error : ''}`}
          onClick={() => fileInputRefs[field]?.current?.click()}
        >
          <input
            ref={fileInputRefs[field]}
            type="file"
            accept={accept}
            onChange={(e) => handleFileUpload(field, e.target.files[0])}
            className={styles.hidden}
          />
          {formData[field] ? (
            <div className={styles['file-uploaded']}>
              <Check size={20} />
              <span>{formData[field].name}</span>
            </div>
          ) : (
            <>
              <IconComponent size={24} />
              <p>Click to upload {label.toLowerCase()}</p>
              <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                {accept.includes('image') ? 'PNG, JPG up to 3MB' : 'PDF, PNG, JPG up to 5MB'}
              </p>
            </>
          )}
        </div>
        {errors[field] && <div className={styles['error-message']}>{errors[field]}</div>}
      </div>
    );
  };

  // --- Step 1: Basic Information ---
  const renderStep1 = () => (
    <div className={styles['step-content']}>
      <h2 className={styles['step-title']}>Business Information</h2>
      <p className={styles['step-description']}>Tell us about your business</p>

      {/* Business Name */}
      <div className={styles['form-group']}>
        <label className={styles.label}>
          Business Name <span className={styles.required}>*</span>
        </label>
        <input
          type="text"
          className={`${styles.input} ${errors.businessName ? styles.error : ''}`}
          placeholder="Enter your business name"
          value={formData.businessName}
          onChange={(e) => handleInputChange('businessName', e.target.value)}
        />
        {errors.businessName && <div className={styles['error-message']}>{errors.businessName}</div>}
      </div>

      {/* Business Email */}
      <div className={styles['form-group']}>
        <label className={styles.label}>
          Business Email <span className={styles.required}>*</span>
        </label>
        <input
          type="email"
          className={`${styles.input} ${errors.businessEmail ? styles.error : ''}`}
          placeholder="business@example.com"
          value={formData.businessEmail}
          onChange={(e) => handleInputChange('businessEmail', e.target.value)}
        />
        {errors.businessEmail && <div className={styles['error-message']}>{errors.businessEmail}</div>}
      </div>

      {/* Phone Number */}
      <div className={styles['form-group']}>
        <label className={styles.label}>
          Phone Number <span className={styles.required}>*</span>
        </label>
        <div className={`${styles['phone-input-wrapper']} ${(errors.countryCode || errors.phoneNumber) ? styles.error : ''}`}>
          <div className={styles['country-selector']} onClick={() => setShowCountryDropdown(!showCountryDropdown)}>
            <span className={styles['selected-country']}>
              <FlagDisplay country={selectedCountry || { name: '', flag: '', iso: '' }} />
              <span>{selectedCountry?.code}</span>
            </span>
            <ChevronDown size={16} />
          </div>
          
          {showCountryDropdown && (
            <div className={styles['country-dropdown-menu']}>
              <input
                type="text"
                placeholder="Search countries..."
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                className={styles['country-search']}
              />
              <div className={styles['country-list']}>
                {filteredCountries.map((country) => (
                  <div
                    key={country.code}
                    className={styles['country-option']}
                    onClick={() => {
                      handleInputChange('countryCode', country.code);
                      setShowCountryDropdown(false);
                      setCountrySearch('');
                    }}
                  >
                    <FlagDisplay country={country} />
                    <span className={styles['country-name']}>{country.name}</span>
                    <span className={styles['country-code']}>{country.code}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <input
            type="tel"
            className={styles['phone-number-input']}
            placeholder="XXX XXX XX XX"
            value={formData.phoneNumber}
            onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
          />
        </div>
        {(errors.countryCode || errors.phoneNumber) && (
          <div className={styles['error-message']}>
            {errors.countryCode || errors.phoneNumber}
          </div>
        )}
      </div>

      {/* Business Address */}
      <div className={styles['form-group']}>
        <label className={styles.label}>
          Business Address <span className={styles.required}>*</span>
        </label>
        <textarea
          className={`${styles.input} ${styles.textarea} ${errors.businessAddress ? styles.error : ''}`}
          placeholder="Enter your complete business address"
          value={formData.businessAddress}
          onChange={(e) => handleInputChange('businessAddress', e.target.value)}
          rows={3}
        />
        {errors.businessAddress && <div className={styles['error-message']}>{errors.businessAddress}</div>}
      </div>

      {/* Business Logo */}
      <div className={styles['form-group']}>
        <label className={styles.label}>Business Logo (Optional)</label>
        <div
          className={styles['file-upload']}
          onClick={() => fileInputRefs.businessLogo?.current?.click()}
        >
          <input
            ref={fileInputRefs.businessLogo}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload('businessLogo', e.target.files[0])}
            className={styles.hidden}
          />
          {formData.businessLogo ? (
            <img
              src={URL.createObjectURL(formData.businessLogo)}
              alt="Business Logo"
              className={styles['preview-image']}
            />
          ) : (
            <>
              <Upload size={32} />
              <span className={styles['file-upload-text']}>Upload Logo</span>
            </>
          )}
        </div>
      </div>
    </div>
  );

  // --- Step 2: Required Documents ---
  const renderStep2 = () => (
    <div className={styles['step-content']}>
      <h2 className={styles['step-title']}>Required Documents</h2>
      <p className={styles['step-description']}>Upload the necessary business documents for verification</p>

      <div className={styles['info-box']}>
        <div className={styles['info-title']}>Required Documents</div>
        <ul className={styles['info-list']}>
          <li>Business License or Registration Certificate</li>
          <li>Tax Registration Certificate</li>
          <li>Owner's ID Document (National ID, Passport, etc.)</li>
          <li>Address Proof (Utility bill, lease agreement, etc.)</li>
          <li>Health & Safety Certificate (Optional but recommended)</li>
        </ul>
      </div>

      <div className={styles['documents-grid']}>
        <div className={styles['document-card']}>
          <div className={styles['document-header']}>
            <div className={styles['document-icon']}><FileText /></div>
            <div>
              <div className={styles['document-title']}>Business License</div>
              <div className={styles['document-description']}>Official business registration or license</div>
            </div>
          </div>
          {renderFileUpload('businessLicense', 'Business License', 'application/pdf,image/*', true, FileText)}
        </div>

        <div className={styles['document-card']}>
          <div className={styles['document-header']}>
            <div className={styles['document-icon']}><FileText /></div>
            <div>
              <div className={styles['document-title']}>Tax Certificate</div>
              <div className={styles['document-description']}>Tax registration certificate</div>
            </div>
          </div>
          {renderFileUpload('taxCertificate', 'Tax Certificate', 'application/pdf,image/*', true, FileText)}
        </div>

        <div className={styles['document-card']}>
          <div className={styles['document-header']}>
            <div className={styles['document-icon']}><User /></div>
            <div>
              <div className={styles['document-title']}>Owner ID Document</div>
              <div className={styles['document-description']}>National ID, passport, or driver's license</div>
            </div>
          </div>
          {renderFileUpload('ownerIdDocument', 'Owner ID Document', 'application/pdf,image/*', true, User)}
        </div>

        <div className={styles['document-card']}>
          <div className={styles['document-header']}>
            <div className={styles['document-icon']}><MapPin /></div>
            <div>
              <div className={styles['document-title']}>Address Proof</div>
              <div className={styles['document-description']}>Utility bill or lease agreement</div>
            </div>
          </div>
          {renderFileUpload('addressProof', 'Address Proof', 'application/pdf,image/*', true, MapPin)}
        </div>

        <div className={styles['document-card']}>
          <div className={styles['document-header']}>
            <div className={styles['document-icon']}><Shield /></div>
            <div>
              <div className={styles['document-title']}>Health & Safety Certificate</div>
              <div className={styles['document-description']}>Health permit or safety certification (Optional)</div>
            </div>
          </div>
          {renderFileUpload('healthSafetyCert', 'Health & Safety Certificate', 'application/pdf,image/*', false, Shield)}
        </div>
      </div>
    </div>
  );

  // --- Step 3: Storefront Photos ---
  const renderStep3 = () => (
    <div className={styles['step-content']}>
      <h2 className={styles['step-title']}>Storefront Photos</h2>
      <p className={styles['step-description']}>Upload photos of your business location (2-5 photos required)</p>

      <div className={styles['info-box']}>
        <div className={styles['info-title']}>Photo Requirements</div>
        <ul className={styles['info-list']}>
          <li>Minimum 2 photos, maximum 5 photos</li>
          <li>Clear photos of your business exterior</li>
          <li>Include storefront sign and entrance</li>
          <li>Photos should be recent and well-lit</li>
        </ul>
      </div>

      <div className={styles['form-group']}>
        <label className={styles.label}>
          Storefront Photos <span className={styles.required}>*</span>
        </label>
        <div className={`${styles['photos-upload']} ${errors.storefrontPhotos ? styles.error : ''}`}>
          <input
            ref={fileInputRefs.storefrontPhotos}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFileUpload('storefrontPhotos', e.target.files)}
            className={styles.hidden}
          />
          <Camera size={32} />
          <p>Upload photos of your business storefront</p>
          <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '1rem' }}>
            JPG, PNG up to 3MB each. Select multiple files.
          </p>
          <button
            type="button"
            className={styles['upload-button']}
            onClick={() => fileInputRefs.storefrontPhotos?.current?.click()}
            disabled={formData.storefrontPhotos.length >= 5}
          >
            {formData.storefrontPhotos.length >= 5 ? 'Maximum Photos Reached' : 'Choose Photos'}
          </button>
        </div>
        {errors.storefrontPhotos && <div className={styles['error-message']}>{errors.storefrontPhotos}</div>}
      </div>

      {formData.storefrontPhotos.length > 0 && (
        <div className={styles['photos-preview']}>
          <div className={styles['photos-count']}>
            {formData.storefrontPhotos.length} of 5 photos uploaded
          </div>
          <div className={styles['photos-grid']}>
            {formData.storefrontPhotos.map((photo, index) => (
              <div key={index} className={styles['photo-item']}>
                <img
                  src={URL.createObjectURL(photo)}
                  alt={`Storefront photo ${index + 1}`}
                  className={styles['photo-preview']}
                />
                <button
                  type="button"
                  className={styles['photo-remove']}
                  onClick={() => removeStorefrontPhoto(index)}
                  title="Remove photo"
                >
                  ×
                </button>
                <div className={styles['photo-number']}>{index + 1}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // --- Step 4: Success ---
  const renderStep4 = () => {
    console.log('renderStep4 called');
    return (
      <div style={{ 
        maxWidth: '32rem', 
        margin: '0 auto', 
        textAlign: 'center', 
        padding: '2rem',
        backgroundColor: '#f0f9ff', // Light blue background to make it visible
        border: '2px solid #0ea5e9', // Blue border
        borderRadius: '0.5rem'
      }}>
        <div style={{
          backgroundColor: '#d1fae5',
          borderRadius: '50%',
          width: '5rem',
          height: '5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.5rem'
        }}>
          <Check size={48} style={{ color: '#10b981' }} />
        </div>
        <h2 style={{ 
          fontSize: '1.875rem', 
          fontWeight: 'bold', 
          color: '#111827', 
          marginBottom: '1rem' 
        }}>
          Application Submitted Successfully!
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          Thank you for submitting your business application. We will review your information and documents, and get back to you within 2-3 business days.
        </p>
        <div style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          borderRadius: '0.5rem',
          padding: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ fontWeight: '600', color: '#1e40af', marginBottom: '0.5rem' }}>
            What happens next?
          </div>
          <ul style={{ textAlign: 'left', color: '#1e40af', fontSize: '0.875rem' }}>
            <li>Our team will review your application and all submitted documents</li>
            <li>We may contact you for additional information if needed</li>
            <li>Once approved, you'll receive access to your vendor dashboard</li>
            <li>You can then start adding products and managing your business</li>
            <li>You'll receive email notifications about your application status</li>
          </ul>
        </div>
        <button
          style={{
            backgroundColor: '#10b981',
            color: 'white',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.5rem',
            border: 'none',
            fontWeight: '500',
            cursor: 'pointer'
          }}
          onClick={() => onBack && onBack()}
        >
          Back to Dashboard
        </button>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles['back-btn']} onClick={onBack}>
          <ArrowLeft />
          Back to Dashboard
        </button>
        <h1 className={styles.title}>Business Application</h1>
        <div></div>
      </div>

      {currentStep <= 3 && renderStepIndicator()}

      <div className={styles['form-container']}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}

        {currentStep <= 3 && (
          <div className={styles.navigation}>
            <button
              className={styles['btn-Secondary']}
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Previous
            </button>

            {currentStep === 3 ? (
              <button
                className={`${styles['btn-primary']} ${styles['btn-submit']}`}
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <div className={styles['loading-spinner']} />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </button>
            ) : (
              <button
                className={styles['myButton']}
                onClick={nextStep}
              >
                Next
              </button>
            )}
          </div>
        )}

        {submitError && (
          <div className={styles['error-alert']}>
            <AlertCircle />
            <span>{submitError}</span>
          </div>
        )}
      </div>
      {console.log('Rendering step:', currentStep)}
    </div>
  );
};

export default BusinessApplication;