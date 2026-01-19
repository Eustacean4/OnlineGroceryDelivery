import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Search, 
  Filter, 
  Eye, 
  MessageCircle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  User,
  Calendar,
  Send,
  Paperclip,
  Download,
  ArrowLeft,
  MoreVertical
} from 'lucide-react';
import styles from './TicketSystem.module.css';

const API_BASE_URL = 'http://127.0.0.1:8000/api'; // Your Laravel API URL

// API utility functions
const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('auth_token');
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
      return;
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

const TicketSystem = ({ tickets: propTickets, onViewTicket, onUpdateTicketStatus }) => {
  const [activeView, setActiveView] = useState('list'); // 'list' or 'detail'
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [tickets, setTickets] = useState(propTickets || []);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);

  const totalTickets = tickets.length;
  const openTickets = tickets.filter(t => t.status === 'open').length;
  const inProgressTickets = tickets.filter(t => t.status === 'in_progress').length;
  const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;
  const closedTickets = tickets.filter(t => t.status === 'closed').length;

  useEffect(() => {
    if (!propTickets) {
      fetchTickets();
    }
  }, [propTickets]);

  useEffect(() => {
    if (propTickets) {
      setTickets(propTickets);
      setFilteredTickets(propTickets);
    }
  }, [propTickets]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/admin/tickets');
      setTickets(data);
      setFilteredTickets(data);
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const filtered = tickets.filter(ticket => {
      const matchesSearch = 
        ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.user?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = !statusFilter || ticket.status === statusFilter;
      const matchesPriority = !priorityFilter || ticket.priority === priorityFilter;
      const matchesType = !typeFilter || ticket.type === typeFilter;

      return matchesSearch && matchesStatus && matchesPriority && matchesType;
    });

    setFilteredTickets(filtered);
  }, [searchTerm, statusFilter, priorityFilter, typeFilter, tickets]);

  const handleViewTicket = async (ticket) => {
    if (onViewTicket) {
      onViewTicket(ticket);
    } else {
      try {
        const fullTicket = await apiRequest(`/admin/tickets/${ticket.id}`);
        setSelectedTicket(fullTicket);
        setActiveView('detail');
      } catch (error) {
        console.error('Error fetching ticket details:', error);
        setSelectedTicket(ticket);
        setActiveView('detail');
      }
    }
  };

  const handleBackToList = () => {
    setActiveView('list');
    setSelectedTicket(null);
    setReplyMessage('');
    setSelectedFile(null);
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    try {
      if (onUpdateTicketStatus) {
        await onUpdateTicketStatus(ticketId, newStatus);
      } else {
        await apiRequest(`/admin/tickets/${ticketId}/status`, {
          method: 'PUT',
          body: JSON.stringify({ status: newStatus })
        });
      }

      const updatedTickets = tickets.map(ticket =>
        ticket.id === ticketId ? { ...ticket, status: newStatus, updated_at: new Date().toISOString() } : ticket
      );
      setTickets(updatedTickets);
      
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating ticket status:', error);
      alert('Failed to update ticket status');
    }
  };

  const handleSendReply = async () => {
    if (!replyMessage.trim() && !selectedFile) return;

    try {
      await apiRequest(`/admin/tickets/${selectedTicket.id}/respond`, {
        method: 'POST',
        body: JSON.stringify({
          response: replyMessage,
          status: 'resolved'
        })
      });

      const updatedTicket = {
        ...selectedTicket,
        admin_response: replyMessage,
        status: 'resolved',
        updated_at: new Date().toISOString(),
        responded_at: new Date().toISOString()
      };

      setSelectedTicket(updatedTicket);
      
      const updatedTickets = tickets.map(ticket =>
        ticket.id === selectedTicket.id ? updatedTicket : ticket
      );
      setTickets(updatedTickets);

      setReplyMessage('');
      setSelectedFile(null);
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply');
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

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <MessageCircle className={`${styles.statusIcon} ${styles.open}`} />;
      case 'in_progress': return <Clock className={`${styles.statusIcon} ${styles.inProgress}`} />;
      case 'resolved': return <CheckCircle className={`${styles.statusIcon} ${styles.resolved}`} />;
      case 'closed': return <XCircle className={`${styles.statusIcon} ${styles.closed}`} />;
      default: return <MessageCircle className={styles.statusIcon} />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const renderTicketStats = () => (
    <div className={styles.statsGrid}>
      <div className={`${styles.statCard} ${styles.total}`}>
        <div className={styles.statNumber}>{totalTickets}</div>
        <div className={styles.statLabel}>Total Tickets</div>
      </div>
      <div className={`${styles.statCard} ${styles.open}`}>
        <div className={styles.statNumber}>{openTickets}</div>
        <div className={styles.statLabel}>Open</div>
      </div>
      <div className={`${styles.statCard} ${styles.inProgress}`}>
        <div className={styles.statNumber}>{inProgressTickets}</div>
        <div className={styles.statLabel}>In Progress</div>
      </div>
      <div className={`${styles.statCard} ${styles.resolved}`}>
        <div className={styles.statNumber}>{resolvedTickets}</div>
        <div className={styles.statLabel}>Resolved</div>
      </div>
      <div className={`${styles.statCard} ${styles.closed}`}>
        <div className={styles.statNumber}>{closedTickets}</div>
        <div className={styles.statLabel}>Closed</div>
      </div>
    </div>
  );

  const renderTicketList = () => (
    <div className={styles.ticketListView}>
      <div className={styles.ticketHeader}>
        <h2>
          <MessageSquare size={24} />
          Support Tickets
        </h2>
        <p>Manage customer support tickets and inquiries</p>
      </div>

      {renderTicketStats()}

      <div className={styles.ticketFilters}>
        <div className={styles.searchFilter}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className={styles.filterGroup}>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            <option value="general">General</option>
            <option value="payment">Payment</option>
            <option value="delivery">Delivery</option>
            <option value="account">Account</option>
            <option value="technical">Technical</option>
            <option value="complaint">Complaint</option>
            <option value="refund">Refund</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingState}>Loading tickets...</div>
      ) : (
        <div className={styles.ticketsContainer}>
          {filteredTickets.length === 0 ? (
            <div className={styles.emptyState}>
              <MessageSquare size={48} />
              <h3>No tickets found</h3>
              <p>No tickets match your current filters.</p>
            </div>
          ) : (
            <div className={styles.ticketsGrid}>
              {filteredTickets.map(ticket => (
                <div key={ticket.id} className={`${styles.ticketCard} ${styles[ticket.status] || ''}`}>
                  <div className={styles.badgesContainer}>
                    <span className={`${styles.priorityBadge} ${styles[ticket.priority]}`}>
                      {ticket.priority?.toUpperCase()}
                    </span>
                    <span className={`${styles.statusBadge} ${styles[ticket.status]}`}>
                      {ticket.status === 'in_progress' ? 'In Progress' : 
                      ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                    </span>
                    <span className={`${styles.typeBadge}`}>
                      {ticket.type?.toUpperCase()}
                    </span>
                  </div>
                  
                  <h3 className={styles.ticketTitle}>{ticket.subject}</h3>
                  <p className={styles.ticketDescription}>
                    {ticket.description?.substring(0, 100)}
                    {ticket.description?.length > 100 && '...'}
                  </p>
                  
                  <div className={styles.ticketMeta}>
                    <div className={styles.ticketUser}>
                      👤 {ticket.user?.name} <span className={styles.userType}>({ticket.user?.role})</span>
                    </div>
                    <div className={styles.ticketDate}>
                      📅 {new Date(ticket.created_at).toLocaleString()}
                    </div>
                  </div>
                  
                  <div className={styles.ticketActions}>
                    <select 
                      value={ticket.status}
                      onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                      className={styles.statusSelect}
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                    <button 
                      className={styles.viewDetailsBtn}
                      onClick={() => handleViewTicket(ticket)}
                    >
                      👁 View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderTicketDetail = () => (
    <div className={styles.ticketDetailView}>
      <div className={styles.ticketDetailHeader}>
        <button className={styles.backBtn} onClick={handleBackToList}>
          <ArrowLeft size={18} />
          Back to Tickets
        </button>
        <div className={styles.ticketDetailTitle}>
          <h2>Ticket #{selectedTicket.id}</h2>
          <div className={styles.ticketDetailStatus}>
            {getStatusIcon(selectedTicket.status)}
            <span>{selectedTicket.status.replace('_', ' ')}</span>
            <div 
              className={styles.priorityBadge} 
              style={{ backgroundColor: getPriorityColor(selectedTicket.priority) }}
            >
              {selectedTicket.priority}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.ticketDetailContent}>
        <div className={styles.ticketInfoPanel}>
          <div className={styles.ticketInfoCard}>
            <h3>Ticket Information</h3>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Subject:</span>
              <span className={styles.infoValue}>{selectedTicket.subject}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Status:</span>
              <select
                value={selectedTicket.status}
                onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value)}
                className={styles.statusSelect}
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Priority:</span>
              <span className={styles.infoValue}>{selectedTicket.priority}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Type:</span>
              <span className={styles.infoValue}>{selectedTicket.type}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Created:</span>
              <span className={styles.infoValue}>{formatDate(selectedTicket.created_at)}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Updated:</span>
              <span className={styles.infoValue}>{formatDate(selectedTicket.updated_at)}</span>
            </div>
          </div>

          <div className={styles.userInfoCard}>
            <h3>Customer Information</h3>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Name:</span>
              <span className={styles.infoValue}>{selectedTicket.user?.name}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Email:</span>
              <span className={styles.infoValue}>{selectedTicket.user?.email}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Role:</span>
              <span className={styles.infoValue}>{selectedTicket.user?.role}</span>
            </div>
          </div>
        </div>

        <div className={styles.conversationPanel}>
          <h3>Conversation</h3>
          <div className={styles.messagesContainer}>
            <div className={`${styles.message} ${styles.user}`}>
              <div className={styles.messageHeader}>
                <div className={styles.messageSender}>
                  <User size={16} />
                  <span>{selectedTicket.user?.name}</span>
                  <span className={styles.senderType}>(customer)</span>
                </div>
                <div className={styles.messageTime}>
                  {formatDate(selectedTicket.created_at)}
                </div>
              </div>
              <div className={styles.messageContent}>
                {selectedTicket.description}
              </div>
            </div>

            {selectedTicket.admin_response && (
              <div className={`${styles.message} ${styles.admin}`}>
                <div className={styles.messageHeader}>
                  <div className={styles.messageSender}>
                    <User size={16} />
                    <span>{selectedTicket.admin?.name || 'Admin'}</span>
                    <span className={styles.senderType}>(admin)</span>
                  </div>
                  <div className={styles.messageTime}>
                    {formatDate(selectedTicket.responded_at || selectedTicket.updated_at)}
                  </div>
                </div>
                <div className={styles.messageContent}>
                  {selectedTicket.admin_response}
                </div>
              </div>
            )}
          </div>

          {selectedTicket.status !== 'closed' && (
            <div className={styles.replySection}>
              <h4>Send Reply</h4>
              <div className={styles.replyForm}>
                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply..."
                  rows="4"
                />
                <div className={styles.replyActions}>
                  <div className={styles.fileUpload}>
                    <input
                      type="file"
                      id="attachment"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="attachment" className={styles.fileUploadBtn}>
                      <Paperclip size={16} />
                      Attach File
                    </label>
                    {selectedFile && (
                      <span className={styles.selectedFile}>{selectedFile.name}</span>
                    )}
                  </div>
                  <button 
                    className={styles.sendReplyBtn}
                    onClick={handleSendReply}
                    disabled={!replyMessage.trim() && !selectedFile}
                  >
                    <Send size={16} />
                    Send Reply
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.ticketSystem}>
      {activeView === 'list' ? renderTicketList() : renderTicketDetail()}
    </div>
  );
};

export default TicketSystem;
