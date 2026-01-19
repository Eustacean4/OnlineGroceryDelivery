import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  MessageCircle,
  Calendar,
  Upload,
  Download,
  Plus
} from 'lucide-react';
import styles from './ApplicationsManager.module.css';

const ApplicationsManager = ({ token, onNewApplication }) => {
  const [applications, setApplications] = useState([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [notification, setNotification] = useState({ message: '', type: '' });

  // Fetch applications
  useEffect(() => {
    if (!token) return;
    fetchApplications();
  }, [token]);

  // Auto-hide notifications
  useEffect(() => {
    if (notification.message) {
      const timer = setTimeout(() => {
        setNotification({ message: '', type: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchApplications = async () => {
    setLoadingApplications(true);
    try {
      const res = await fetch('/api/business-applications', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        }
      });

      if (!res.ok) throw new Error('Failed to fetch applications');
      const data = await res.json();
      setApplications(data);
    } catch (error) {
      setNotification({ 
        message: 'Failed to load applications', 
        type: 'error' 
      });
    } finally {
      setLoadingApplications(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className={styles['status-icon']} />;
      case 'under_review':
        return <Eye className={styles['status-icon']} />;
      case 'approved':
        return <CheckCircle className={styles['status-icon']} />;
      case 'rejected':
        return <XCircle className={styles['status-icon']} />;
      default:
        return <AlertCircle className={styles['status-icon']} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return '#f59e0b'; // Yellow
      case 'under_review':
        return '#3b82f6'; // Blue
      case 'approved':
        return '#10b981'; // Green
      case 'rejected':
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'Pending Review';
      case 'under_review':
        return 'Under Review';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };

  const filteredApplications = applications.filter(app => {
    if (statusFilter === 'all') return true;
    return app.status === statusFilter;
  });

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setShowDetails(true);
  };

  const handleResubmit = (application) => {
    // Pass the application data for editing
    onNewApplication(application);
  };

  return (
    <div className={styles.container}>
      {/* Notification */}
      {notification.message && (
        <div className={`${styles.notification} ${styles[notification.type]}`}>
          <AlertCircle size={20} />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Business Applications</h1>
          <p className={styles.subtitle}>
            Track the status of your business applications and manage submissions
          </p>
        </div>
        <button 
          className={styles.newApplicationBtn}
          onClick={onNewApplication}
        >
          <Plus size={20} />
          New Application
        </button>
      </div>

      {/* Status Summary Cards */}
      <div className={styles.summaryCards}>
        <div className={styles.summaryCard}>
          <div className={styles.cardIcon} style={{ backgroundColor: '#fef3c7' }}>
            <Clock size={24} style={{ color: '#f59e0b' }} />
          </div>
          <div className={styles.cardContent}>
            <h3>{applications.filter(app => app.status === 'pending').length}</h3>
            <p>Pending</p>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardIcon} style={{ backgroundColor: '#dbeafe' }}>
            <Eye size={24} style={{ color: '#3b82f6' }} />
          </div>
          <div className={styles.cardContent}>
            <h3>{applications.filter(app => app.status === 'under_review').length}</h3>
            <p>Under Review</p>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardIcon} style={{ backgroundColor: '#d1fae5' }}>
            <CheckCircle size={24} style={{ color: '#10b981' }} />
          </div>
          <div className={styles.cardContent}>
            <h3>{applications.filter(app => app.status === 'approved').length}</h3>
            <p>Approved</p>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <div className={styles.cardIcon} style={{ backgroundColor: '#fee2e2' }}>
            <XCircle size={24} style={{ color: '#ef4444' }} />
          </div>
          <div className={styles.cardContent}>
            <h3>{applications.filter(app => app.status === 'rejected').length}</h3>
            <p>Rejected</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className={styles.filterTabs}>
        {['all', 'pending', 'under_review', 'approved', 'rejected'].map(filter => (
          <button
            key={filter}
            className={`${styles.filterTab} ${statusFilter === filter ? styles.active : ''}`}
            onClick={() => setStatusFilter(filter)}
          >
            {filter === 'all' ? 'All Applications' : getStatusText(filter)}
          </button>
        ))}
      </div>

      {/* Applications List */}
      <div className={styles.applicationsContainer}>
        {loadingApplications ? (
          <div className={styles.loadingState}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading applications...</p>
          </div>
        ) : filteredApplications.length === 0 ? (
          <div className={styles.emptyState}>
            <FileText size={64} className={styles.emptyIcon} />
            <h3>No Applications Found</h3>
            <p>
              {statusFilter === 'all' 
                ? "You haven't submitted any business applications yet."
                : `No ${getStatusText(statusFilter).toLowerCase()} applications found.`
              }
            </p>
            {statusFilter === 'all' && (
              <button 
                className={styles.newApplicationBtn}
                onClick={onNewApplication}
                style={{ marginTop: '1rem' }}
              >
                <Plus size={20} />
                Submit Your First Application
              </button>
            )}
          </div>
        ) : (
          <div className={styles.applicationsList}>
            {filteredApplications.map((application) => (
              <div key={application.id} className={styles.applicationCard}>
                {/* Card Header */}
                <div className={styles.cardHeader}>
                  <div className={styles.applicationInfo}>
                    <h3 className={styles.businessName}>{application.name}</h3>
                    <p className={styles.applicationId}>Application #{application.id}</p>
                  </div>
                  <div 
                    className={styles.statusBadge}
                    style={{ backgroundColor: getStatusColor(application.status) }}
                  >
                    {getStatusIcon(application.status)}
                    <span>{getStatusText(application.status)}</span>
                  </div>
                </div>

                {/* Card Content */}
                <div className={styles.cardContent}>
                  <div className={styles.applicationDetails}>
                    <div className={styles.detailItem}>
                      <Calendar size={16} />
                      <span>Submitted: {new Date(application.created_at).toLocaleDateString()}</span>
                    </div>
                    {application.reviewed_at && (
                      <div className={styles.detailItem}>
                        <Calendar size={16} />
                        <span>Reviewed: {new Date(application.reviewed_at).toLocaleDateString()}</span>
                      </div>
                    )}
                    <div className={styles.detailItem}>
                      <FileText size={16} />
                      <span>{application.email}</span>
                    </div>
                  </div>

                  {/* Admin Feedback */}
                  {application.admin_feedback && (
                    <div className={styles.feedback}>
                      <div className={styles.feedbackHeader}>
                        <MessageCircle size={16} />
                        <span>Admin Feedback</span>
                      </div>
                      <p className={styles.feedbackText}>{application.admin_feedback}</p>
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {application.status === 'rejected' && application.rejection_reason && (
                    <div className={styles.rejectionReason}>
                      <div className={styles.rejectionHeader}>
                        <XCircle size={16} />
                        <span>Rejection Reason</span>
                      </div>
                      <p className={styles.rejectionText}>{application.rejection_reason}</p>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className={styles.cardActions}>
                  <button
                    className={styles.actionBtn}
                    onClick={() => handleViewDetails(application)}
                  >
                    <Eye size={16} />
                    View Details
                  </button>

                  {application.status === 'rejected' && (
                    <button
                      className={`${styles.actionBtn} ${styles.resubmitBtn}`}
                      onClick={() => handleResubmit(application)}
                    >
                      <RefreshCw size={16} />
                      Resubmit
                    </button>
                  )}

                  <button className={styles.actionBtn}>
                    <Download size={16} />
                    Download Documents
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Application Details Modal */}
      {showDetails && selectedApplication && (
        <div className={styles.modalOverlay} onClick={() => setShowDetails(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Application Details</h2>
              <button 
                className={styles.closeBtn}
                onClick={() => setShowDetails(false)}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.detailsGrid}>
                <div className={styles.detailGroup}>
                  <h4>Business Information</h4>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Name:</span>
                    <span>{selectedApplication.name}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Email:</span>
                    <span>{selectedApplication.email}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Phone:</span>
                    <span>{selectedApplication.phone}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Address:</span>
                    <span>{selectedApplication.address}</span>
                  </div>
                </div>

                <div className={styles.detailGroup}>
                  <h4>Application Status</h4>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Current Status:</span>
                    <span className={styles.statusText} style={{ color: getStatusColor(selectedApplication.status) }}>
                      {getStatusText(selectedApplication.status)}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Submitted:</span>
                    <span>{new Date(selectedApplication.created_at).toLocaleString()}</span>
                  </div>
                  {selectedApplication.reviewed_at && (
                    <div className={styles.detailRow}>
                      <span className={styles.label}>Reviewed:</span>
                      <span>{new Date(selectedApplication.reviewed_at).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className={styles.timeline}>
                <h4>Application Timeline</h4>
                <div className={styles.timelineItems}>
                  <div className={styles.timelineItem}>
                    <div className={styles.timelineIcon} style={{ backgroundColor: '#10b981' }}>
                      <Upload size={16} />
                    </div>
                    <div className={styles.timelineContent}>
                      <h5>Application Submitted</h5>
                      <p>{new Date(selectedApplication.created_at).toLocaleString()}</p>
                    </div>
                  </div>

                  {selectedApplication.status !== 'pending' && (
                    <div className={styles.timelineItem}>
                      <div className={styles.timelineIcon} style={{ backgroundColor: getStatusColor(selectedApplication.status) }}>
                        {getStatusIcon(selectedApplication.status)}
                      </div>
                      <div className={styles.timelineContent}>
                        <h5>Status Updated to {getStatusText(selectedApplication.status)}</h5>
                        <p>{selectedApplication.reviewed_at ? new Date(selectedApplication.reviewed_at).toLocaleString() : 'Recently'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationsManager;