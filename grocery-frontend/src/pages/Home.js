import React, { useEffect, useState, useRef} from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FaSearch, FaHeart } from 'react-icons/fa';
import './Home.css';

import { useCart } from '../hooks/useCart';
import { useWishlist } from '../hooks/useWishlist';


export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogoutLoading, setShowLogoutLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [businesses, setBusinesses] = useState([]);
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const location = useLocation();
  const featuredBusinessesRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ products: [], businesses: [] });
  const [isSearching, setIsSearching] = useState(false);
  const { cart, cartCount, cartTotal, addToCart, updateQuantity, removeFromCart, clearCart } = useCart();
  const { wishlist, toggleWishlist, isInWishlist } = useWishlist();
  const [isCartOpen, setIsCartOpen] = useState(false);
  

  useEffect(() => {
  const token = localStorage.getItem('auth_token');

  if (!token) {
    setIsLoggedIn(false);
    return;
  }

  fetch('http://localhost:8000/api/profile', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })
    .then((res) => {
      if (!res.ok) throw new Error('Invalid token');
      return res.json();
    })
    .then(() => {
      setIsLoggedIn(true);
    })
    .catch(() => {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      setIsLoggedIn(false);
    });
}, [location]); 

  const handleLogout = () => {
    setShowLogoutLoading(true);
    setTimeout(() => {
      localStorage.removeItem('auth_user');
      localStorage.removeItem('auth_token');
      setIsLoggedIn(false);
      setShowLogoutLoading(false);
      navigate('/');
    }, 1500);
  };

  // Add search function:
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults({ products: [], businesses: [] });
      return;
    }

    setIsSearching(true);
    try {
      const [productsRes, businessesRes] = await Promise.all([
        fetch(`http://localhost:8000/api/products?search=${encodeURIComponent(query)}`),
        fetch(`http://localhost:8000/api/public/businesses?search=${encodeURIComponent(query)}`)
      ]);

      const productsData = await productsRes.json();
      const businessesData = await businessesRes.json();

      setSearchResults({
        products: Array.isArray(productsData) ? productsData : productsData.data || [],
        businesses: Array.isArray(businessesData) ? businessesData : businessesData.data || []
      });
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults({ products: [], businesses: [] });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToCart = (product) => {
    const businessId = product.business?.id || product.business_id;
    addToCart(product, 1, businessId);
  };

  const handleToggleWishlist = async (product) => {
    await toggleWishlist(product); // The wishlist hook already handles the login check and notification
  };

  // Update search input handler:
  const handleSearchInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Debounce search
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      handleSearch(query);
    }, 300);
  };

  useEffect(() => {
    const handleScroll = () => {
      const button = document.querySelector('.back-to-top');
      if (window.scrollY > 200) {
        button?.classList.add('show');
      } else {
        button?.classList.remove('show');
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');

    fetch('http://localhost:8000/api/public/businesses', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
      },
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('Fetched businesses:', data);
        console.log('🚀 businesses API returned:', data);

        // ✅ inspect if it's data or data.data
        if (Array.isArray(data)) {
          setBusinesses(data);
        } else if (Array.isArray(data.data)) {
          setBusinesses(data.data);
        } else {
          setBusinesses([]); // fallback
        }
      })
      .catch((err) => {
        console.error('Failed to fetch businesses', err);
        setBusinesses([]);
      });
  }, []);

  useEffect(() => {
    fetch('http://localhost:8000/api/products')
      .then((res) => res.json())
      .then((data) => {
        console.log('Fetched products:', data);
        if (Array.isArray(data)) {
          setProducts(data);
        } else if (Array.isArray(data.data)) {
          setProducts(data.data);
        } else {
          setProducts([]);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch products:', err);
        setProducts([]);
      });
  }, []);


  const handleStartShopping = () => {
    featuredBusinessesRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

 

  return (
    <>
      {showLogoutLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}

      <header>
        <div className="container header-container">
          <div className="logo">
            <img src={require('../images/logo.png')} alt="Organic Shop Logo" />
          </div>

          <div className="user-actions">
            <span className="search-icon" onClick={() => setShowSearch(!showSearch)}>
              <FaSearch />
            </span>
            <Link to="/my-account" state={{ activeTab: 'wishlist' }}>Wishlist</Link>
            <div className="cart-toggle" onClick={() => setIsCartOpen(!isCartOpen)}>
              Cart ({cartCount})
            </div>
            {isLoggedIn ? (
              <>
                <Link to="/my-account">My Account</Link>
                <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>Logout</a>
              </>
            ) : (
              <>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
              </>
            )}
          </div>
        </div>

        {showSearch && (
          <div className="container search-bar">
            <input 
              type="text" 
              placeholder="Search for Products or Businesses..." 
              value={searchQuery}
              onChange={handleSearchInputChange}
              autoFocus 
            />
            {isSearching && <span style={{marginLeft: '10px', color: '#666'}}>Searching...</span>}
            
            {(searchResults.products.length > 0 || searchResults.businesses.length > 0) && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '4px',
                maxHeight: '400px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                {searchResults.businesses.length > 0 && (
                  <div style={{padding: '10px', borderBottom: '1px solid #eee'}}>
                    <h4 style={{margin: '0 0 8px 0', color: '#333'}}>Businesses</h4>
                    {searchResults.businesses.slice(0, 3).map(business => (
                      <div key={business.id} style={{padding: '8px 0', borderBottom: '1px solid #f5f5f5'}}>
                        <Link 
                          to="/business-store" 
                          state={{ business }}
                          style={{color: '#4a8f29', textDecoration: 'none'}}
                          onClick={() => setShowSearch(false)}
                        >
                          {business.name}
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
                
                {searchResults.products.length > 0 && (
                  <div style={{padding: '10px'}}>
                    <h4 style={{margin: '0 0 8px 0', color: '#333'}}>Products</h4>
                    {searchResults.products.slice(0, 5).map(product => (
                      <div key={product.id} style={{
                        display: 'flex', 
                        alignItems: 'center', 
                        padding: '8px 0',
                        borderBottom: '1px solid #f5f5f5'
                      }}>
                        <img 
                          src={`http://localhost:8000/storage/${product.image}`}
                          alt={product.name}
                          style={{width: '40px', height: '40px', objectFit: 'cover', marginRight: '10px'}}
                        />
                        <div style={{flex: 1}}>
                          <div style={{fontWeight: '500'}}>{product.name}</div>
                          <div style={{fontSize: '12px', color: '#666'}}>
                            {product.business?.name} - ${product.price}
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            handleAddToCart(product);
                            setShowSearch(false);
                          }}
                          style={{
                            backgroundColor: '#4a8f29',
                            color: 'white',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '3px',
                            fontSize: '12px'
                          }}
                        >
                          Add to Cart
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </header>
      
      <section className="hero">
        <div className="hero-content">
          <h1>Discover Groceries from Multiple Businesses</h1>
          <p>Shop fresh, organic, and local products from your favorite stores all in one place.</p>
          <button className="btn" onClick={handleStartShopping}>Start Shopping</button>
        </div>
      </section>

      <main className="container">
        {/* Featured Businesses */}
        <h2 ref={featuredBusinessesRef} className="section-title">Featured Businesses</h2>
        <div className="categories">
          {businesses.map((business) => (
            <div className="category-card" key={business.id}>
              <div className="category-img">
                <img
                  src={`http://localhost:8000/storage/${business.logo}`}
                  alt={business.name}
                  style={{
                    width: '100%',
                    height: '180px',
                    objectFit: 'cover',
                    borderRadius: '8px 8px 0 0'
                  }}
                />
              </div>
              <div className="category-info">
                <h3>{business.name}</h3>
                <Link to="/business-store" state={{ business }} className="visit-store-btn">Visit Store</Link>
              </div>
            </div>
          ))}
        </div>


        {/* Featured Products */}
        <h2 className="section-title">Featured Products</h2>
        <div className="products-grid">
          {products.map((product) => (
            <div className="product-card" key={product.id} style={{ position: 'relative' }}>
              <div className="product-image">
                <img
                  src={`http://localhost:8000/storage/${product.image}`}
                  alt={product.name}
                  style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '5px' }}
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
              </div>
              <h3 className="product-title">{product.name}</h3>
              <p className="product-description">{product.description}</p>
              <p className="product-business">From: {product.business?.name || 'Unknown Business'}</p>
              <div className="product-price">₺{product.price}</div>   
              <button 
                className="add-to-cart"
                onClick={() => handleAddToCart(product)}
              >
                Add to Cart
              </button>          
            </div>
          ))}
        </div>


        {/* Best Sellers */}
        
        <h2 className="section-title">Best Sellers</h2>
        <div className="products-grid">
          <div className="product-card" style={{ position: 'relative' }}>
            <div className="product-image">
              <img src={require('../images/products/fresh-bananas.jpeg')} alt="Fresh Bananas" style={{width: '100%', height: '180px', objectFit: 'cover', borderRadius: '5px'}} />

               {/* Wishlist Heart Button */}
                <button
                  onClick={() => handleToggleWishlist({
                    id: 'bs-1',
                    name: 'Fresh Bananas',
                    price: '1.99',
                    description: 'Sweet and ripe bananas, perfect for snacking',
                    business: { name: 'Fresh Fruit Market', id: 1 },
                    image: 'products/fresh-bananas.jpeg'
                  })}
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
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  title={isInWishlist('bs-1') ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <FaHeart 
                    style={{ 
                      color: isInWishlist('bs-1') ? '#ff4757' : '#ddd',
                      fontSize: '16px'
                    }} 
                  />
                </button>
            </div>
            <h3 className="product-title">Fresh Bananas</h3>
            <p className="product-description">Sweet and ripe bananas, perfect for snacking</p>
            <p className="product-business">From: Fresh Fruit Market</p>
            <div className="product-price">$1.99</div>
            <button 
              className="add-to-cart"
              onClick={() => handleAddToCart({
                id: 'bs-1',
                name: 'Fresh Bananas',
                price: '1.99',
                description: 'Sweet and ripe bananas, perfect for snacking',
                business: { name: 'Fresh Fruit Market', id: 1 },
                image: 'products/fresh-bananas.jpeg'
              })}
            >
              Add to Cart
            </button>
          </div>

          <div className="product-card" style={{ position: 'relative' }}>
            <div className="product-image">
              <img src={require('../images/products/free-range-eggs.jpg')} alt="Free-range Eggs" style={{width: '100%', height: '180px', objectFit: 'cover', borderRadius: '5px'}} />
               {/* Wishlist Heart Button */}
                <button
                  onClick={() => handleToggleWishlist({
                    id: 'bs-1',
                    name: 'Fresh Bananas',
                    price: '1.99',
                    description: 'Sweet and ripe bananas, perfect for snacking',
                    business: { name: 'Fresh Fruit Market', id: 1 },
                    image: 'products/fresh-bananas.jpeg'
                  })}
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
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  title={isInWishlist('bs-1') ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <FaHeart 
                    style={{ 
                      color: isInWishlist('bs-1') ? '#ff4757' : '#ddd',
                      fontSize: '16px'
                    }} 
                  />
                </button>
            </div>
            <h3 className="product-title">Free-range Eggs</h3>
            <p className="product-description">Farm-fresh free-range eggs from happy hens</p>
            <p className="product-business">From: Countryside Farm</p>
            <div className="product-price">$2.49</div>
            <button 
              className="add-to-cart"
              onClick={() => handleAddToCart({
                id: 'bs-2',
                name: 'Free-range Eggs',
                price: '2.49',
                description: 'Farm-fresh free-range eggs from happy hens',
                business: { name: 'Countryside Farm', id: 2 },
                image: 'products/free-range-eggs.jpg'
              })}
            >
              Add to Cart
            </button>
          </div>

          <div className="product-card" style={{ position: 'relative' }}>
            <div className="product-image">
              <img src={require('../images/products/organic-honey.jpeg')} alt="Organic Honey" style={{width: '100%', height: '180px', objectFit: 'cover', borderRadius: '5px'}} />
               {/* Wishlist Heart Button */}
                <button
                  onClick={() => handleToggleWishlist({
                    id: 'bs-1',
                    name: 'Fresh Bananas',
                    price: '1.99',
                    description: 'Sweet and ripe bananas, perfect for snacking',
                    business: { name: 'Fresh Fruit Market', id: 1 },
                    image: 'products/fresh-bananas.jpeg'
                  })}
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
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                  title={isInWishlist('bs-1') ? 'Remove from wishlist' : 'Add to wishlist'}
                >
                  <FaHeart 
                    style={{ 
                      color: isInWishlist('bs-1') ? '#ff4757' : '#ddd',
                      fontSize: '16px'
                    }} 
                  />
                </button>
            </div>
            <h3 className="product-title">Organic Honey</h3>
            <p className="product-description">Pure organic honey from local beekeepers</p>
            <p className="product-business">From: Bee Happy Organics</p>
            <div className="product-price">$6.00</div>
            <button 
              className="add-to-cart"
              onClick={() => handleAddToCart({
                id: 'bs-3',
                name: 'Organic Honey',
                price: '6.00',
                description: 'Pure organic honey from local beekeepers',
                business: { name: 'Bee Happy Organics', id: 3 },
                image: 'products/organic-honey.jpeg'
              })}
            >
              Add to Cart
            </button>
          </div>
        </div>


        {/* Why Shop With Us */}
        <h2 className="section-title">Why Shop With Us?</h2>
        <div className="why-shop">
          <div className="shop-benefit">
            <h4>✅ Trusted Vendors</h4>
            <p>We partner only with reliable and certified vendors.</p>
          </div>
          <div className="shop-benefit">
            <h4>🚚 Fast Delivery</h4>
            <p>Quick and reliable delivery service to your doorstep.</p>
          </div>
          <div className="shop-benefit">
            <h4>🌱 Organic & Fresh</h4>
            <p>Enjoy hand-picked, chemical-free organic groceries.</p>
          </div>
        </div>
      </main>
      <div className={`cart-sidebar ${isCartOpen ? 'open' : ''}`}>
        <div className="cart-header">
          <h3>Your Cart</h3>
          <button className="close-cart" onClick={() => setIsCartOpen(false)}>×</button>
        </div>
        <div className="cart-items">
          {cart.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <>
              {cart.map((item) => (
              <div key={item.id} className="cart-item">
                <img 
                  src={
                    item.image?.startsWith('http') 
                      ? item.image 
                      : item.image?.startsWith('products/') 
                        ? require(`../images/${item.image}`)
                        : `http://localhost:8000/storage/${item.image}`
                  }
                  alt={item.name}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/60x60?text=Product';
                  }}
                />
                <div className="item-details">
                  <p><strong>{item.name}</strong></p>
                  <p>${parseFloat(item.price).toFixed(2)}</p>
                  <div className="quantity-controls">
                    <button onClick={() => updateQuantity(item.id, -1)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)}>+</button>
                  </div>
                  <button className="remove" onClick={() => removeFromCart(item.id)}>Remove</button>
                </div>
              </div>
            ))}

              {/* ➕ Subtotal and Checkout */}
              <div className="cart-summary">
                <p><strong>Subtotal:</strong> ₺{cartTotal.toFixed(2)}</p>
                 <button
                  onClick={() => {
                    if (!isLoggedIn) {
                      navigate('/login');
                      return;
                    }
                    navigate('/checkout');
                  }}
                  disabled={cart.length === 0}
                  className="checkout-button"
                >
                  Go to Checkout
                </button>
              </div>
             
            </>
          )}
        </div>
        
      </div>
       


      <footer>
        <div className="container">
          <div className="footer-content">
            <div className="footer-column">
              <h3>Quick Links</h3>
              <ul>
                <li><a href="/about">About Us</a></li>
                <li><a href="/contact">Contact</a></li>
                <li><a href="/feedback">Feedback</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h3>Contact</h3>
              <ul>
                <li>123 Market Lane</li>
                <li>Grocer City, GR 45678</li>
                <li>Phone: (555) 123-4567</li>
                <li>Email: hello@groceryhub.com</li>
              </ul>
            </div>
          </div>
          <div className="copyright">
            <p>© 2025 GroceryHub. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <button
        className="back-to-top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        ↑
      </button>
    </>
    
  );
}
