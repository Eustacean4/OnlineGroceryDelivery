import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  MapPin, 
  ShoppingBag,
  Star,
  TrendingUp,
  Calendar,
  Download,
  MessageSquare
} from 'lucide-react';
import styles from './CustomerSection.module.css';

const CustomerSection = ({ token, selectedBusiness }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [customers, setCustomers] = useState([]);
  const [customerStats, setCustomerStats] = useState({
    totalCustomers: 0,
    newThisMonth: 0,
    averageOrderValue: 0,
    topSpender: null
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Fetch customer data
  useEffect(() => {
    if (!token || !selectedBusiness) return;
    
    setLoading(true);
    Promise.all([
      fetch(`${process.env.REACT_APP_API_URL || ''}/api/businesses/${selectedBusiness.id}/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      fetch(`/api/businesses/${selectedBusiness.id}/customer-stats`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    ])
   .then(async ([customerRes, statsRes]) => {
        if (!customerRes.ok || !statsRes.ok) {
            throw new Error('Failed to fetch data');
        }
        
        const customerData = await customerRes.json();
        const statsData = await statsRes.json();
        
        setCustomers(customerData || []);
        setCustomerStats(statsData || {
            totalCustomers: 0,
            newThisMonth: 0,
            averageOrderValue: 0,
            topSpender: null
        });
    })
    .catch(err => {
      setMessage({ text: 'Failed to load customer data', type: 'error' });
    })
    .finally(() => setLoading(false));
  }, [token, selectedBusiness]);

  // Filter customers based on search and filter type
  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterType === 'all') return matchesSearch;
    if (filterType === 'vip') return matchesSearch && customer.total_spent > 1000;
    if (filterType === 'new') return matchesSearch && customer.days_since_first_order <= 30;
    if (filterType === 'inactive') return matchesSearch && customer.days_since_last_order > 60;
    
    return matchesSearch;
  });

  const handleSendMessage = async (customerId, messageText) => {
    try {
      const res = await fetch('/api/customers/send-message', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customer_id: customerId,
          message: messageText,
          business_id: selectedBusiness.id
        })
      });

      if (!res.ok) throw new Error();
      
      setMessage({ text: 'Message sent successfully!', type: 'success' });
      setShowMessageModal(false);
    } catch {
      setMessage({ text: 'Failed to send message', type: 'error' });
    }
  };

  const exportCustomerData = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Name,Email,Phone,Total Orders,Total Spent,Last Order\n"
      + filteredCustomers.map(customer => 
          `${customer.name},${customer.email},${customer.phone || ''},${customer.total_orders},${customer.total_spent},${customer.last_order_date || ''}`
        ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `customers-${selectedBusiness?.name || 'export'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!selectedBusiness) {
    return (
      <div className={styles.emptyState}>
        <Users size={48} />
        <h3>No Business Selected</h3>
        <p>Please select a business to view customer data</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {message.text && (
        <div className={`${styles.notification} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <div className={styles.header}>
        <h2>Customer Management - {selectedBusiness.name}</h2>
        <div className={styles.headerActions}>
          <button onClick={exportCustomerData} className={styles.exportBtn}>
            <Download size={16} />
            Export Data
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={styles.tabNav}>
        <button 
          className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'customers' ? styles.active : ''}`}
          onClick={() => setActiveTab('customers')}
        >
          Customer List
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'analytics' ? styles.active : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading customer data...</p>
        </div>
      )  : customers.length === 0 ? (
        <div className={styles.emptyState}>
          <Users size={48} />
          <h3>No Customers Yet</h3>
          <p>This business has no customers who have placed orders yet.</p>
        </div>
      ) : (
        
        <>
          {activeTab === 'overview' && (
            <div className={styles.overview}>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <Users />
                  </div>
                  <div className={styles.statInfo}>
                    <h3>{customerStats.totalCustomers}</h3>
                    <p>Total Customers</p>
                  </div>
                </div>
                
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <TrendingUp />
                  </div>
                  <div className={styles.statInfo}>
                    <h3>{customerStats.newThisMonth}</h3>
                    <p>New This Month</p>
                  </div>
                </div>
                
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <ShoppingBag />
                  </div>
                  <div className={styles.statInfo}>
                    <h3>₺{customerStats.averageOrderValue}</h3>
                    <p>Avg Order Value</p>
                  </div>
                </div>
                
                <div className={styles.statCard}>
                  <div className={styles.statIcon}>
                    <Star />
                  </div>
                  <div className={styles.statInfo}>
                    <h3>{customerStats.topSpender?.name || 'N/A'}</h3>
                    <p>Top Customer</p>
                  </div>
                </div>
              </div>

              {/* Recent Customers */}
              <div className={styles.recentCustomers}>
                <h3>Recent Customers</h3>
                <div className={styles.customerList}>
                  {customers.slice(0, 5).map(customer => (
                    <div key={customer.id} className={styles.customerItem}>
                      <div className={styles.customerAvatar}>
                        {customer.profile_picture ? (
                          <img src={`/storage/${customer.profile_picture}`} alt={customer.name} />
                        ) : (
                          <span>{customer.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className={styles.customerInfo}>
                        <h4>{customer.name}</h4>
                        <p>{customer.email}</p>
                        <span className={styles.customerStats}>
                          {customer.total_orders} orders • ₺{customer.total_spent}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'customers' && (
            <div className={styles.customersTab}>
              {/* Search and Filter */}
              <div className={styles.searchFilter}>
                <div className={styles.searchBox}>
                  <Search size={20} />
                  <input
                    type="text"
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <select 
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value)}
                  className={styles.filterSelect}
                >
                  <option value="all">All Customers</option>
                  <option value="vip">VIP Customers</option>
                  <option value="new">New Customers</option>
                  <option value="inactive">Inactive Customers</option>
                </select>
              </div>

              {/* Customer Grid */}
              <div className={styles.customerGrid}>
                {filteredCustomers.map(customer => (
                  <div key={customer.id} className={styles.customerCard}>
                    <div className={styles.customerHeader}>
                      <div className={styles.customerAvatar}>
                        {customer.profile_picture ? (
                          <img src={`/storage/${customer.profile_picture}`} alt={customer.name} />
                        ) : (
                          <span>{customer.name.charAt(0)}</span>
                        )}
                      </div>
                      <div className={styles.customerBasicInfo}>
                        <h4>{customer.name}</h4>
                        <div className={styles.customerBadge}>
                          {customer.total_spent > 1000 ? 'VIP' : 
                           customer.days_since_first_order <= 30 ? 'New' : 
                           customer.days_since_last_order > 60 ? 'Inactive' : 'Regular'}
                        </div>
                      </div>
                    </div>
                    
                    <div className={styles.customerDetails}>
                      <div className={styles.contactInfo}>
                        <div className={styles.contactItem}>
                          <Mail size={16} />
                          <span>{customer.email}</span>
                        </div>
                        {customer.phone && (
                          <div className={styles.contactItem}>
                            <Phone size={16} />
                            <span>{customer.phone}</span>
                          </div>
                        )}
                        {customer.address && (
                          <div className={styles.contactItem}>
                            <MapPin size={16} />
                            <span>{customer.address}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className={styles.orderInfo}>
                        <div className={styles.orderStat}>
                          <span className={styles.statNumber}>{customer.total_orders}</span>
                          <span className={styles.statLabel}>Orders</span>
                        </div>
                        <div className={styles.orderStat}>
                          <span className={styles.statNumber}>₺{customer.total_spent}</span>
                          <span className={styles.statLabel}>Total Spent</span>
                        </div>
                      </div>
                      
                      <div className={styles.lastOrder}>
                        <Calendar size={14} />
                        <span>Last order: {customer.last_order_date || 'Never'}</span>
                      </div>
                    </div>
                    
                    <div className={styles.customerActions}>
                        <button 
                            onClick={() => setSelectedCustomer(customer)}
                            className={styles.viewBtn}
                            style={{ width: '100%' }}
                        >
                            View Details
                        </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className={styles.analytics}>
              <h3>Customer Analytics</h3>
              <div className={styles.analyticsGrid}>
                <div className={styles.analyticsCard}>
                  <h4>Customer Segments</h4>
                  <div className={styles.segmentList}>
                    <div className={styles.segment}>
                      <span>VIP Customers</span>
                      <span>{customers.filter(c => c.total_spent > 1000).length}</span>
                    </div>
                    <div className={styles.segment}>
                      <span>Regular Customers</span>
                      <span>{customers.filter(c => c.total_spent <= 1000 && c.total_spent > 0).length}</span>
                    </div>
                    <div className={styles.segment}>
                      <span>New Customers</span>
                      <span>{customers.filter(c => c.days_since_first_order <= 30).length}</span>
                    </div>
                    <div className={styles.segment}>
                      <span>Inactive Customers</span>
                      <span>{customers.filter(c => c.days_since_last_order > 60).length}</span>
                    </div>
                  </div>
                </div>
                
                <div className={styles.analyticsCard}>
                  <h4>Top Customers by Spending</h4>
                  <div className={styles.topCustomers}>
                    {customers
                      .sort((a, b) => b.total_spent - a.total_spent)
                      .slice(0, 5)
                      .map((customer, index) => (
                        <div key={customer.id} className={styles.topCustomerItem}>
                          <span className={styles.rank}>#{index + 1}</span>
                          <span className={styles.name}>{customer.name}</span>
                          <span className={styles.amount}>₺{customer.total_spent}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Message Modal */}
      {/*{showMessageModal && selectedCustomer && (
        <MessageModal
          customer={selectedCustomer}
          onSend={handleSendMessage}
          onClose={() => {
            setShowMessageModal(false);
            setSelectedCustomer(null);
          }}
        />
      )}*/}

      {/* ADD THIS RIGHT HERE */}
      {selectedCustomer && (
        <CustomerDetailModal
          customer={selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          token={token}
          selectedBusiness={selectedBusiness}
        />
      )}
    </div>
  );
};

// Message Modal Component
  const MessageModal = ({ customer, onSend, onClose }) => {
    const [messageText, setMessageText] = useState('');

    const handleSubmit = (e) => {
      e.preventDefault();
      if (messageText.trim()) {
        onSend(customer.id, messageText);
        setMessageText('');
      }
    };

    return (
      <div className={styles.modalOverlay}>
        <div className={styles.modal}>
          <div className={styles.modalHeader}>
            <h3>Send Message to {customer.name}</h3>
            <button onClick={onClose} className={styles.closeBtn}>×</button>
          </div>
          
          <form onSubmit={handleSubmit} className={styles.messageForm}>
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message here..."
              rows="4"
              required
            />
            
            <div className={styles.modalActions}>
              <button type="button" onClick={onClose} className={styles.cancelBtn}>
                Cancel
              </button>
              <button type="submit" className={styles.sendBtn}>
                Send Message
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };
  // ADD THE NEW MODAL HERE - RIGHT AFTER MessageModal
  const CustomerDetailModal = ({ customer, onClose, token, selectedBusiness }) => {
    return (
      <div className={styles.modalOverlay} onClick={onClose}>
        <div className={styles.customerDetailModal} onClick={e => e.stopPropagation()}>
          <div className={styles.modalHeader}>
            <h3>{customer.name} - Details</h3>
            <button onClick={onClose} className={styles.closeBtn}>×</button>
          </div>
          <div style={{ padding: '1rem' }}>
            <p><strong>Email:</strong> {customer.email}</p>
            <p><strong>Phone:</strong> {customer.phone || 'N/A'}</p>
            <p><strong>Total Orders:</strong> {customer.total_orders}</p>
            <p><strong>Total Spent:</strong> ₺{customer.total_spent}</p>
          </div>
        </div>
      </div>
    );
  };

export default CustomerSection;