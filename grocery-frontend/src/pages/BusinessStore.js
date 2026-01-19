import React, { useState, useEffect } from 'react';
import './BusinessStore.css';
import { useLocation, useNavigate } from 'react-router-dom';

import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';
import { FaHeart } from 'react-icons/fa'; // if not already imported


const BusinessStore = () => {
  const [categoryMap, setCategoryMap] = useState({});
  const location = useLocation();
  const navigate = useNavigate();
  const { business } = location.state || {};
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState(['All']);
  const { cart, cartCount, cartTotal, addToCart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  
  useEffect(() => {
    // Fetch categories from database with IDs
      fetch('http://127.0.0.1:8000/api/categories')
          .then(res => res.json())
          .then(data => {
              // Store categories with both ID and name
              const categoryMap = {};
              data.forEach(cat => {
                  categoryMap[cat.id] = cat.name;
              });
              
              // Store the mapping for filtering
              setCategoryMap(categoryMap);
              
              const dbCategoryNames = data.map(cat => cat.name);
              setCategories(['All', ...dbCategoryNames]);
          })
          .catch(error => {
              console.error('Error fetching categories:', error);
          });
  }, []);


  // Fetch products for the business
  useEffect(() => {
    if (business?.id) {
      setIsLoading(true);
      fetch(`http://127.0.0.1:8000/api/businesses/${business.id}/products`)
        .then(res => res.json())
        .then(data => {
          const allProducts = data.products || [];
          setProducts(allProducts);
          setIsLoading(false);
        })
        .catch(error => {
          console.error('Error fetching products:', error);
          setIsLoading(false);
        });
    }
  }, [business]);

  // Close cart when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isCartOpen && !event.target.closest('.cart-sidebar') && !event.target.closest('.toggle-cart-btn')) {
        setIsCartOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCartOpen]);
  
  // Filter products based on category and search term
  // Filter products based on category and search term
  const filteredProducts = products.filter(product => {
    // Get category name from category_id
    const productCategoryName = categoryMap[product.category_id];
    const matchesCategory = selectedCategory === 'All' || productCategoryName === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (product, quantity = 1) => {
    addToCart(product, quantity, business.id);
  };

  // ✅ ADD NEW wishlist function:
  const handleToggleWishlist = async (product) => {
    await toggleWishlist(product); // The wishlist hook already handles the login check and notification
  };
  
  // Get unique categories for filter dropdown
  //const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

  if (!business) {
    return (
      <div className="business-store">
        <div className="store-container">
          <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
            <h2>No business selected</h2>
            <p>Please select a business to view their products.</p>
            <button 
              onClick={() => navigate('/')}
              style={{
                padding: '12px 24px',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600'
              }}
            >
              Go back to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="business-store">
      {/* Toggle Cart Button */}
      <button className="toggle-cart-btn" onClick={() => setIsCartOpen(!isCartOpen)}>
        {isCartOpen ? 'Close Cart' : `Cart (${cartCount})`}
      </button>

      <div className="store-container" style={{ marginRight: isCartOpen ? '400px' : '0' }}>
        {/* Back Link */}
        <a className="back-link" onClick={() => navigate(-1)}>
          ← Back to Businesses
        </a>

        {/* Business Info Section */}
        <div className="business-info">
          <img
            src={`http://127.0.0.1:8000/storage/${business.logo}`}
            alt={`${business.name} Logo`}
            className="business-logo"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/100x100?text=Logo';
            }}
          />
          <h2 className="business-name">{business.name}</h2>
          {business.description && (
            <p style={{ fontSize: '16px', opacity: '0.9', maxWidth: '600px', margin: '10px auto 0' }}>
              {business.description}
            </p>
          )}
        </div>

        {/* Search Bar */}
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <div className="category-filter">
          <label>Filter by Category:</label>
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
            {categories.map(category => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Products Section */}
        <h3 className="product-heading">
          {selectedCategory === 'All' ? 'All Products' : `${selectedCategory} Products`}
          {filteredProducts.length > 0 && (
            <span style={{ fontSize: '16px', fontWeight: 'normal', color: '#666', marginLeft: '10px' }}>
              ({filteredProducts.length} items)
            </span>
          )}
        </h3>

        {/* Loading State */}
        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#666' }}>
            <p>Loading products...</p>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '50px', color: '#666' }}>
                <h3>No products found</h3>
                <p>
                  {searchTerm ? 
                    `No products match "${searchTerm}" in ${selectedCategory === 'All' ? 'any category' : selectedCategory}` :
                    `No products available in ${selectedCategory === 'All' ? 'this store' : selectedCategory}`
                  }
                </p>
                {(searchTerm || selectedCategory !== 'All') && (
                  <button 
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('All');
                    }}
                    style={{
                      marginTop: '20px',
                      padding: '10px 20px',
                      background: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer'
                    }}
                  >
                    Show All Products
                  </button>
                )}
              </div>
            ) : (
              filteredProducts.map(product => (
                <div key={product.id} className="product-card">
                  <img
                    src={`http://127.0.0.1:8000/storage/${product.image}`}
                    alt={product.name}
                    className="product-image"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/280x200?text=Product+Image';
                    }}
                  />

                  {/* Wishlist Heart Button */}
                  <button
                    onClick={() => handleToggleWishlist(product)}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '35px',
                      height: '35px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      transition: 'all 0.2s ease'
                    }}
                    title={isInWishlist(product.id) ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <FaHeart 
                      style={{ 
                        color: isInWishlist(product.id) ? '#ff4757' : '#ddd',
                        fontSize: '16px'
                      }} 
                    />
                  </button>
                  <h4>{product.name}</h4>
                  {product.description && (
                    <p className="product-description">{product.description}</p>
                  )}
                  <p className="product-price">₺{parseFloat(product.price).toLocaleString()}</p>
                  <button
                    className="add-to-cart-btn"
                    onClick={() => handleAddToCart(product, 1)}
                  >
                    Add to Cart
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

        {/* Cart Sidebar */}
              
        <div className={`cart-sidebar ${isCartOpen ? 'open' : ''}`}>
          <div className="cart-header">
            <h3>Your Cart</h3>
            <button className="close-cart" onClick={() => setIsCartOpen(false)}>×</button>
          </div>
          
          <div className="cart-items">
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', color: '#666' }}>
                <p>Your cart is empty</p>
                <p style={{ fontSize: '14px' }}>Add some products to get started!</p>
              </div>
            ) : (
              <>
                {cart.map((item) => (
                  <div key={item.id} className="cart-item">
                    <img 
                      src={`http://127.0.0.1:8000/storage/${item.image}`} 
                      alt={item.name}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/50x50?text=Product';
                      }}
                    />
                    <div className="item-details">
                      <p><strong>{item.name}</strong></p>
                      <p>₺{parseFloat(item.price).toFixed(2)}</p>
                      <div className="quantity-controls">
                        <button onClick={() => updateQuantity(item.id, -1)}>-</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)}>+</button>
                      </div>
                      <button className="remove" onClick={() => removeFromCart(item.id)}>Remove</button>
                    </div>
                  </div>
                ))}

                {/* Cart Summary */}
                <div className="cart-summary">
                  <p><strong>Items ({cartCount}):</strong> ₺{cartTotal.toFixed(2)}</p>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                    <button 
                      onClick={clearCart}
                      style={{
                        flex: '0 0 auto',
                        padding: '10px 15px',
                        background: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => {
                        navigate('/checkout', { 
                          state: { 
                            cart, 
                            business, 
                            cartTotal 
                          }
                        });
                      }}
                      disabled={cart.length === 0}
                      className="checkout-button"
                      style={{
                        flex: '1',
                        padding: '12px',
                        background: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: '600'
                      }}
                    >
                      Go to Checkout
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
    </div>
  );
};

export default BusinessStore;