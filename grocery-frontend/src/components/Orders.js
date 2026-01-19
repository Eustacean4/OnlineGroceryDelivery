import React, { useEffect, useState } from 'react';
import { FaStore, FaMapMarkerAlt, FaClock, FaReceipt, FaEye } from 'react-icons/fa';
import styles from './Orders.module.css'; // ✅ CSS Module import

const Orders = ({ token }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/my-orders', {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }

        const data = await response.json();
        setOrders(data);
      } catch (err) {
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [token]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return '#f39c12';
      case 'assigned': return '#3498db';
      case 'in_transit': return '#9b59b6';
      case 'delivered': return '#27ae60';
      case 'cancelled': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid': return '#27ae60';
      case 'pending': return '#f39c12';
      case 'failed': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return '⏳';
      case 'assigned': return '👨‍💼';
      case 'in_transit': return '🚚';
      case 'delivered': return '✅';
      case 'cancelled': return '❌';
      default: return '📦';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="tab-content">
        <div className={styles['loading-container']}>
          <div className={styles['loading-spinner']}></div>
          <p>Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-content">
      <div className={styles['profile-header']}>
        <div className="profile-info">
          <h2><FaReceipt /> My Orders</h2>
          <p className="profile-subtitle">Track and view your order history</p>
        </div>
        <div className={styles['orders-stats']}>
          <div className={styles['stat-card']}>
            <span className={styles['stat-number']}>{orders.length}</span>
            <span className={styles['stat-label']}>Total Orders</span>
          </div>
          <div className={styles['stat-card']}>
            <span className={styles['stat-number']}>
              {orders.filter(order => order.status === 'delivered').length}
            </span>
            <span className={styles['stat-label']}>Delivered</span>
          </div>
        </div>
      </div>

      <div className={styles['orders-container']}>
        {error && <div className={styles['error-message']}>{error}</div>}
        
        {!loading && orders.length === 0 && (
          <div className={styles['empty-orders']}>
            <div className={styles['empty-icon']}>📦</div>
            <h3>No Orders Yet</h3>
            <p>Start shopping to see your orders here!</p>
          </div>
        )}

        <div className={styles['orders-grid']}>
          {orders.map(order => (
            <div key={order.id} className={styles['order-card']}>
              <div className={styles['order-header']}>
                <div className={styles['order-info']}>
                  <h3 className={styles['order-id']}>Order #{order.id}</h3>
                  <div className={styles['order-meta']}>
                    <span className="order-date">
                      <FaClock /> {formatDate(order.created_at)}
                    </span>
                  </div>
                </div>
                <div 
                  className={styles['order-status']}
                  style={{ backgroundColor: getStatusColor(order.status) }}
                >
                  <span className={styles['status-icon']}>{getStatusIcon(order.status)}</span>
                  <span className={styles['status-text']}>{order.status?.replace('_', ' ').toUpperCase()}</span>
                </div>
                <div className={styles['payment-info']}>
                  <span className={styles['payment-method']}>
                    💳 {order.payment?.method === 'stripe' ? 'Card' : order.payment?.method || 'Cash'}
                  </span>
                  <span 
                    className={styles['payment-status']}
                    style={{ 
                      backgroundColor: getPaymentStatusColor(order.payment?.status), // Use order.payment.status
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '0.75rem'
                    }}
                  >
                    {order.payment?.status === 'paid' ? '✅ Paid' : '⏳ Pending'}
                  </span>
                </div>
              </div>

              <div className={styles['order-business']}>
                <FaStore className={styles['business-icon']} />
                <span className={styles['business-name']}>{order.business?.name || 'Unknown Business'}</span>
              </div>

              <div className={styles['order-address']}>
                <FaMapMarkerAlt className={styles['address-icon']} />
                <span className={styles['address-text']}>
                  {order.address?.street}, {order.address?.city}
                  {order.address?.state && `, ${order.address.state}`}
                </span>
              </div>

              <div className={styles['order-items-preview']}>
                <div className={styles['items-header']}>
                  <span className={styles['items-count']}>
                    {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                  </span>
                  <button 
                    className={styles['view-items-btn']}
                    onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                  >
                    <FaEye /> {selectedOrder?.id === order.id ? 'Hide' : 'View'} Items
                  </button>
                </div>

                {selectedOrder?.id === order.id && (
                  <div className={styles['order-items-expanded']}>
                    {order.items?.map((item) => (
                      <div key={item.id} className={styles['order-item-detail']}>
                        <img
                          src={
                            item.product?.image
                              ? `http://localhost:8000/storage/${item.product.image}`
                              : '/images/no-image.png'
                          }
                          alt={item.product?.name || 'Unknown Product'}
                          className={styles['item-image']}
                          onError={(e) => { e.target.src = '/images/no-image.png'; }}
                        />
                        <div className={styles['item-info']}>
                          <h4 className={styles['item-name']}>{item.product?.name || 'Unknown Product'}</h4>
                          <div className={styles['item-details']}>
                            <span className={styles['item-quantity']}>Qty: {item.quantity}</span>
                            <span className={styles['item-price']}>₺{Number(item.price || 0).toFixed(2)}</span>
                          </div>
                        </div>
                        <div className={styles['item-total']}>
                          ₺{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles['order-footer']}>
                <div className={styles['order-total']}>
                  <span className={styles['total-label']}>Total:</span>
                  <span className={styles['total-amount']}>₺{Number(order.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Orders;
