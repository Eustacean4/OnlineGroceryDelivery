import { useState, useEffect } from 'react';

export const useWishlist = () => {
  const [wishlist, setWishlist] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const token = localStorage.getItem('auth_token');

  // Fetch wishlist from API
  const fetchWishlist = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/wishlist', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setWishlist(data);
      } else {
        console.error('Failed to fetch wishlist');
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load wishlist on mount
  useEffect(() => {
    fetchWishlist();
  }, [token]);

  // Show notification
  const showNotification = (message, type = 'success') => {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      right: 20px;
      background: ${type === 'success' ? '#4CAF50' : '#f44336'};
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      z-index: 10000;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      font-weight: 600;
      animation: slideIn 0.3s ease;
    `;
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideIn 0.3s ease reverse';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
        if (document.head.contains(style)) {
          document.head.removeChild(style);
        }
      }, 300);
    }, 2000);
  };

  // Add to wishlist
  const addToWishlist = async (product) => {
    if (!token) {
      showNotification('Please login to add items to wishlist', 'error');
      return false;
    }

    try {
      const response = await fetch('http://localhost:8000/api/wishlist', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          product_id: product.id
        }),
      });

      if (response.ok) {
        await fetchWishlist(); // Refresh wishlist
        showNotification(`${product.name} added to wishlist! ❤️`);
        return true;
      } else {
        const errorData = await response.json();
        showNotification(errorData.message || 'Failed to add to wishlist', 'error');
        return false;
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error);
      showNotification('Error adding to wishlist', 'error');
      return false;
    }
  };

  // Remove from wishlist
  const removeFromWishlist = async (productId) => {
    if (!token) return false;

    // Optimistically update the wishlist
    setWishlist(prevWishlist => prevWishlist.filter(item => item.product_id !== productId));

    try {
      const response = await fetch(`http://localhost:8000/api/wishlist/${productId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        showNotification('Removed from wishlist');
        return true;
      } else {
        showNotification('Failed to remove from wishlist', 'error');
        // Optionally revert change if failed:
        await fetchWishlist();
        return false;
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      showNotification('Error removing from wishlist', 'error');
      await fetchWishlist(); // revert
      return false;
    }
  };


  // Toggle wishlist item
  const toggleWishlist = async (product) => {
    const isInWishlist = wishlist.some(item => item.product_id === product.id);
    
    if (isInWishlist) {
      return await removeFromWishlist(product.id);
    } else {
      return await addToWishlist(product);
    }
  };

  // Check if item is in wishlist
  const isInWishlist = (productId) => {
    return wishlist.some(item => item.product_id === productId);
  };

  // Clear entire wishlist
  const clearWishlist = async () => {
    if (!token || wishlist.length === 0) return;

    // Optimistically clear
    const previousWishlist = [...wishlist];
    setWishlist([]);

    try {
      const promises = previousWishlist.map(item => 
        fetch(`http://localhost:8000/api/wishlist/${item.product_id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        })
      );

      await Promise.all(promises);
      showNotification('Wishlist cleared');
      return true;
    } catch (error) {
      console.error('Error clearing wishlist:', error);
      showNotification('Error clearing wishlist', 'error');
      setWishlist(previousWishlist); // revert
      return false;
    }
  };


  return {
    wishlist,
    isLoading,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    clearWishlist,
    refreshWishlist: fetchWishlist
  };
};