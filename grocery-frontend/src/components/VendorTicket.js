// src/components/VendorTicket.js
import React, { useState, useEffect } from 'react';
import { FaPlus, FaQuestionCircle, FaCheck } from 'react-icons/fa';
import styles from './VendorTicket.module.css';
import NotificationModal from './NotificationModal'; // Import the notification modal

const VendorTicket = ({ token }) => {
  const [tickets, setTickets] = useState([]);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    type: 'general',
    priority: 'medium',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  // Add notification state
  const [notification, setNotification] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    showConfirm: false,
    onConfirm: null
  });

  // Notification helper function
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

  // Fetch vendor tickets
  const fetchTickets = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/vendor/tickets', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
      if (!res.ok) throw new Error('Failed to fetch tickets');
      const data = await res.json();
      setTickets(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error('Error fetching tickets:', err);
      showNotification('error', 'Error', 'Failed to fetch tickets. Please try again.');
    }
  };

  useEffect(() => {
    if (token) fetchTickets();
  }, [token]);

  // Create a new ticket
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/vendor/tickets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(newTicket),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create ticket');
      }
      
      const created = await res.json();
      setTickets(prev => [created, ...prev]);
      setShowCreateTicket(false);
      setNewTicket({ subject: '', type: 'general', priority: 'medium', description: '' });
      
      // Show success notification
      showNotification(
        'success', 
        'Ticket Submitted Successfully!', 
        `Your support ticket #${created.id} has been submitted. Our team will review it and respond as soon as possible.`
      );
      
    } catch (err) {
      console.error('Error creating ticket:', err);
      showNotification('error', 'Error', err.message || 'Failed to create ticket. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Priority & status colors
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
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

  return (
    <div className={styles.tabContent}>
      <div className={styles.profileHeader}>
        <div className={styles.profileInfo}>
          <h2>Vendor Support</h2>
          <p className={styles.profileSubtitle}>
            Need help with your vendor account? Submit a support ticket and we'll assist you!
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
                    <option value="product">Product Management</option>
                    <option value="commission">Commission Query</option>
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
                  disabled={loading}
                >
                  {loading ? 'Submitting...' : 'Submit Ticket'}
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
              <p>You haven't submitted any support tickets yet. Click "Create New Ticket" to get help with any vendor-related issues.</p>
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
    </div>
  );
};

export default VendorTicket;