import React, { useState } from 'react';
import { FaHeart, FaShoppingCart, FaTrash, FaStore, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { useWishlist } from '../hooks/useWishlist';
import { useCart } from '../hooks/useCart';
import styles from './WishlistSection.module.css';

// Custom Modal Component
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, type = 'single' }) => {
  if (!isOpen) return null;

  return (
    <div className={styles['modal-overlay']}>
      <div className={styles['modal-content']}>
        <div className={styles['modal-header']}>
          <div className={styles['modal-icon']}>
            <FaExclamationTriangle />
          </div>
          <h3>{title}</h3>
          <button onClick={onClose} className={styles['modal-close']}>
            <FaTimes />
          </button>
        </div>
        <div className={styles['modal-body']}>
          <p>{message}</p>
        </div>
        <div className={styles['modal-footer']}>
          <button onClick={onClose} className={styles['modal-cancel']}>
            Cancel
          </button>
          <button 
            onClick={onConfirm} 
            className={`${styles['modal-confirm']} ${type === 'clear' ? styles['modal-confirm-danger'] : ''}`}
          >
            {type === 'clear' ? 'Clear All' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
};

const WishlistSection = ({ token }) => {
  const { wishlist, isLoading, removeFromWishlist, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  
  // Modal state
  const [modalState, setModalState] = useState({
    isOpen: false,
    type: 'single', // 'single' or 'clear'
    productId: null,
    productName: ''
  });

  const handleAddToCart = (product) => {
    // Convert wishlist item to product format for cart
    const productForCart = {
      id: product.product.id,
      name: product.product.name,
      price: product.product.price,
      image: product.product.image,
      description: product.product.description,
      business: product.product.business,
      business_id: product.product.business_id
    };

    addToCart(productForCart, 1);
  };

  const handleRemoveClick = (productId, productName) => {
    setModalState({
      isOpen: true,
      type: 'single',
      productId: productId,
      productName: productName
    });
  };

  const handleClearClick = () => {
    setModalState({
      isOpen: true,
      type: 'clear',
      productId: null,
      productName: ''
    });
  };

  const handleModalConfirm = async () => {
    try {
      if (modalState.type === 'clear') {
        await clearWishlist();
      } else {
        await removeFromWishlist(modalState.productId);
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
    } finally {
      // Always close the modal regardless of success or error
      setModalState({ isOpen: false, type: 'single', productId: null, productName: '' });
    }
  };

  const handleModalClose = () => {
    setModalState({ isOpen: false, type: 'single', productId: null, productName: '' });
  };

  if (isLoading) {
    return (
      <div className="tab-content">
        <div className={styles['loading-container']}>
          <div className={styles['loading-spinner']}></div>
          <p>Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="tab-content">
        <div className={styles['error-message']}>
          Please log in to view your wishlist.
        </div>
      </div>
    );
  }

  return (
    <div className="tab-content">
      <div className={styles['profile-header']}>
        <div className="profile-info">
          <h2><FaHeart /> My Wishlist</h2>
          <p className="profile-subtitle">Save your favorite products for later</p>
        </div>
        <div className={styles['wishlist-stats']}>
          <div className={styles['stat-card']}>
            <span className={styles['stat-number']}>{wishlist.length}</span>
            <span className={styles['stat-label']}>Saved Items</span>
          </div>
          <div className={styles['stat-card']}>
            <span className={styles['stat-number']}>
              {new Set(wishlist.map(item => item.product?.business?.id || item.product?.business_id)).size}
            </span>
            <span className={styles['stat-label']}>Businesses</span>
          </div>
        </div>
      </div>

      <div className={styles['wishlist-container']}>
        {wishlist.length === 0 ? (
          <div className={styles['empty-wishlist']}>
            <div className={styles['empty-icon']}>💖</div>
            <h3>Your wishlist is empty</h3>
            <p>Save products you love for later by clicking the heart icon</p>
          </div>
        ) : (
          <>
            <div className={styles['wishlist-actions']}>
              <span className={styles['items-count']}>
                {wishlist.length} item{wishlist.length !== 1 ? 's' : ''} saved
              </span>
              <button
                onClick={handleClearClick}
                className={styles['clear-all-btn']}
              >
                <FaTrash /> Clear All
              </button>
            </div>

            <div className={styles['wishlist-grid']}>
              {wishlist.map((item) => (
                <div key={item.id} className={styles['wishlist-card']}>
                  <div className={styles['wishlist-header']}>
                    <div className={styles['wishlist-info']}>
                      <h3 className={styles['product-name']}>{item.product.name}</h3>
                      <div className={styles['wishlist-meta']}>
                        <span className="added-date">
                          Added {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveClick(item.product.id, item.product.name)}
                      className={styles['remove-btn']}
                      title="Remove from wishlist"
                    >
                      <FaTrash />
                    </button>
                  </div>

                  <div className={styles['product-business']}>
                    <FaStore className={styles['business-icon']} />
                    <span className={styles['business-name']}>
                      {item.product.business?.name || 'Unknown Business'}
                    </span>
                  </div>

                  <div className={styles['product-image-container']}>
                    <img
                      src={`http://localhost:8000/storage/${item.product.image}`}
                      alt={item.product.name}
                      className={styles['product-image']}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/280x180?text=Product+Image';
                      }}
                    />
                  </div>

                  {item.product.description && (
                    <div className={styles['product-description']}>
                      <p>{item.product.description}</p>
                    </div>
                  )}

                  <div className={styles['wishlist-footer']}>
                    <div className={styles['product-price']}>
                      <span className={styles['price-label']}>Price:</span>
                      <span className={styles['price-amount']}>₺{parseFloat(item.product.price).toLocaleString()}</span>
                    </div>
                    <button
                      onClick={() => handleAddToCart(item)}
                      className={styles['add-to-cart-btn']}
                    >
                      <FaShoppingCart /> Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Custom Modal */}
      <ConfirmModal
        isOpen={modalState.isOpen}
        onClose={handleModalClose}
        onConfirm={handleModalConfirm}
        title={modalState.type === 'clear' ? 'Clear Entire Wishlist' : 'Remove Product'}
        message={
          modalState.type === 'clear' 
            ? `Are you sure you want to remove all ${wishlist.length} items from your wishlist? This action cannot be undone.`
            : `Are you sure you want to remove "${modalState.productName}" from your wishlist?`
        }
        type={modalState.type}
      />
    </div>
  );
};

export default WishlistSection;