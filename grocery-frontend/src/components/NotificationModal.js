import React from 'react';
import { FaCheck, FaExclamationTriangle, FaTimes, FaInfoCircle } from 'react-icons/fa';
import styles from './NotificationModal.module.css';

const NotificationModal = ({ 
  isOpen, 
  onClose, 
  type = 'info', 
  title, 
  message, 
  showConfirm = false,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel'
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheck className={styles.iconSuccess} />;
      case 'error':
        return <FaTimes className={styles.iconError} />;
      case 'warning':
        return <FaExclamationTriangle className={styles.iconWarning} />;
      default:
        return <FaInfoCircle className={styles.iconInfo} />;
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.iconContainer}>
            {getIcon()}
          </div>
          <h3 className={styles.modalTitle}>{title}</h3>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>
        
        <div className={styles.modalBody}>
          <p className={styles.modalMessage}>{message}</p>
        </div>
        
        <div className={styles.modalFooter}>
          {showConfirm ? (
            <>
              <button 
                className={`${styles.btn} ${styles.btnDanger}`}
                onClick={handleConfirm}
              >
                {confirmText}
              </button>
              <button 
                className={`${styles.btn} ${styles.btnSecondary}`}
                onClick={onClose}
              >
                {cancelText}
              </button>
            </>
          ) : (
            <button 
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={onClose}
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationModal;