import { useState, useEffect } from 'react';

// Unified cart management hook
export const useCart = () => {
  const [cart, setCart] = useState([]);
  const [cartCount, setCartCount] = useState(0);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = JSON.parse(localStorage.getItem('cart')) || [];
    setCart(savedCart);
    updateCartCount(savedCart);
  }, []);

  // Update cart count
  const updateCartCount = (cartItems = cart) => {
    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(totalItems);
  };

  // Save cart to localStorage
  const saveCartToStorage = (cartItems) => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
    updateCartCount(cartItems);
  };

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

  // Add item to cart
  const addToCart = (product, quantity = 1, currentBusinessId = null) => {
    if (!product || quantity < 1) {
      showNotification('Invalid product or quantity', 'error');
      return false;
    }

    // Check if user is logged in
    const token = localStorage.getItem('auth_token');
    if (!token) {
      showNotification('Please login to add items to cart', 'error');
      return false;
    }

    setCart(prevCart => {
      // Check if cart has items from different business
      if (prevCart.length > 0) {
        const firstItemBusinessId = prevCart[0].businessId || prevCart[0].business_id;
        const newItemBusinessId = currentBusinessId || product.business?.id || product.business_id;
        
        if (firstItemBusinessId && newItemBusinessId && firstItemBusinessId !== newItemBusinessId) {
          showNotification('You can only add products from one business at a time. Please clear your cart first.', 'error');
          return prevCart;
        }
      }

      const existingIndex = prevCart.findIndex(item => item.id === product.id);
      let updatedCart = [...prevCart];

      if (existingIndex >= 0) {
        updatedCart[existingIndex] = {
          ...updatedCart[existingIndex],
          quantity: updatedCart[existingIndex].quantity + quantity
        };
      } else {
        const newItem = {
          ...product,
          quantity,
          price: parseFloat(product.price),
          businessId: currentBusinessId || product.business?.id || product.business_id,
          business_name: product.business?.name || product.business_name || 'Unknown Business'
        };
        updatedCart.push(newItem);
      }

      saveCartToStorage(updatedCart);
      showNotification(`${product.name} added to cart! 🛒`);
      return updatedCart;
    });

    return true;
  };

  // Update quantity
  const updateQuantity = (productId, delta) => {
    setCart(prevCart => {
      const updatedCart = prevCart.map(item => {
        if (item.id === productId) {
          const newQuantity = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQuantity };
        }
        return item;
      });
      saveCartToStorage(updatedCart);
      return updatedCart;
    });
  };

  // Remove from cart
  const removeFromCart = (productId) => {
    setCart(prevCart => {
      const updatedCart = prevCart.filter(item => item.id !== productId);
      saveCartToStorage(updatedCart);
      showNotification('Item removed from cart');
      return updatedCart;
    });
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
    setCartCount(0);
    showNotification('Cart cleared');
  };

  // Calculate totals
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return {
    cart,
    cartCount,
    cartTotal,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    setCart // For direct cart updates if needed
  };
};