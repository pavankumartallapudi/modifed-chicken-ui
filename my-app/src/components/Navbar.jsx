import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../CartContext';
import ReactModal from 'react-modal';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import './Navbar.css';

const Navbar = ({ searchQuery, onSearchChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const { cart, addToCart, removeFromCart, clearCart } = useCart();
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const navigate = useNavigate();

  const [checkoutStep, setCheckoutStep] = useState('cart');
  const [orderDetails, setOrderDetails] = useState({ name: '', phone: '', address: '' });
  const [orderId, setOrderId] = useState('');
  const [allItems, setAllItems] = useState([]);

  const cartItems = Object.values(cart);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.dish.price * item.quantity, 0);
  const cartParentItem = allItems.find(item => item.id === cartItems[0]?.dish.parent_id);

  useEffect(() => {
    const fetchAllItems = async () => {
      const { data } = await supabase.from('admin_items').select('*');
      setAllItems(data || []);
    };
    fetchAllItems();
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Error fetching user:', error);
      } else {
        setUser(data.user);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error);
    } else {
      navigate('/login');
    }
  };

  async function handleOrderSubmit(e) {
    e.preventDefault();
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        name: orderDetails.name,
        phone: orderDetails.phone,
        address: orderDetails.address,
        total_price: cartTotal,
      }])
      .select()
      .single();
    if (orderError) {
      alert('Order failed: ' + orderError.message);
      return;
    }
    const orderItems = cartItems.map(item => ({
      order_id: order.id,
      dish_id: item.dish.id,
      quantity: item.quantity,
      price_at_order: item.dish.price,
    }));
    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);
    if (itemsError) {
      alert('Order items failed: ' + itemsError.message);
      return;
    }
    setOrderId(order.id);
    clearCart();
    setCheckoutStep('confirm');
  }

  useEffect(() => {
    if (cartModalOpen) {
      setCheckoutStep('cart');
    }
  }, [cartModalOpen]);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const username = user?.email?.split('@')[0] || 'Guest';

  return (
    <>
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <button className="close-btn" onClick={toggleSidebar}>
            <span className="material-icons">arrow_back</span>
          </button>
        </div>
        <div className="profile-section">
          <span className="profile-icon material-icons">account_circle</span>
          <span className="welcome-text">Welcome, {username}</span>
        </div>
        <div className="sidebar-footer">
          <button className="logout-action" onClick={handleLogout}>
            <span className="material-icons">logout</span>
            <span>Logout</span>
          </button>
        </div>
      </div>
      {isOpen && <div className="overlay" onClick={toggleSidebar}></div>}
      
      <header className="navbar-header">
        <button className="hamburger-btn" onClick={toggleSidebar}>
          <span className="material-icons">menu</span>
        </button>
        <div className="search-bar">
          <span className="search-icon material-icons">search</span>
          <input
            type="text"
            placeholder="Search for restaurants, cuisines or dishes..."
            value={searchQuery}
            onChange={onSearchChange}
          />
        </div>
        <button className="cart-btn" onClick={() => setCartModalOpen(true)}>
          <span className="material-icons">shopping_cart</span>
          {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </button>
      </header>

      <ReactModal
        isOpen={cartModalOpen}
        onRequestClose={() => setCartModalOpen(false)}
        className="admin-menu-modal cart-background"
        overlayClassName="admin-menu-modal-overlay"
        contentLabel="Cart Modal"
      >
        <button className="admin-menu-modal-close" onClick={() => setCartModalOpen(false)}>&times;</button>
        <h2 className="cart-title">Your Cart</h2>
        {cartParentItem && <div className="cart-restaurant-name">{cartParentItem.name}</div>}
        {checkoutStep === 'cart' && (
          cartItems.length === 0 ? (
            <div className="cart-empty-message">
              <DotLottieReact
                src="/animations/sad.lottie"
                loop
                autoplay
                style={{ width: 180, height: 180, marginBottom: 16 }}
              />
              <span>Your cart is empty.</span>
            </div>
          ) : (
            <div className="cart-content">
              <div className="cart-items-list">
                {cartItems.map((item) => (
                  <div key={item.dish.id} className="cart-item">
                    <div className="cart-item-details">
                      <div className="cart-item-name">{item.dish.name}</div>
                      <div className="cart-item-price">₹{item.dish.price}</div>
                    </div>
                    <div className="cart-item-controls">
                      <button className="quantity-btn" onClick={() => removeFromCart(item.dish)}>
                        <span className="material-icons">remove</span>
                      </button>
                      <span className="quantity-display">{item.quantity}</span>
                      <button className="quantity-btn" onClick={() => addToCart(item.dish)}>
                        <span className="material-icons">add</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="cart-summary">
                <div className="cart-total">
                  <span>Total:</span>
                  <span className="total-amount">₹{cartTotal.toFixed(2)}</span>
                </div>
                <button className="cart-checkout-btn" onClick={() => setCheckoutStep('form')}>
                  Proceed to Checkout
                </button>
              </div>
            </div>
          )
        )}
        {checkoutStep === 'form' && (
          <form onSubmit={handleOrderSubmit} style={{ padding: '20px 0' }}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Name:</label>
              <input
                type="text"
                required
                value={orderDetails.name}
                onChange={e => setOrderDetails({...orderDetails, name: e.target.value})}
                style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd', fontSize: 16 }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Phone:</label>
              <input
                type="tel"
                required
                value={orderDetails.phone}
                onChange={e => setOrderDetails({...orderDetails, phone: e.target.value})}
                style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd', fontSize: 16 }}
              />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Address:</label>
              <textarea
                required
                value={orderDetails.address}
                onChange={e => setOrderDetails({...orderDetails, address: e.target.value})}
                style={{ width: '100%', padding: 12, borderRadius: 8, border: '1px solid #ddd', fontSize: 16, minHeight: 80 }}
              />
            </div>
            <button type="submit" style={{ width: '100%', padding: 12, background: '#ff4d5a', color: 'white', border: 'none', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>
              Place Order
            </button>
          </form>
        )}
        {checkoutStep === 'confirm' && (
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h3 style={{ marginBottom: 8 }}>Order Placed Successfully!</h3>
            <p style={{ color: '#666', marginBottom: 16 }}>Order ID: {orderId}</p>
            <p style={{ color: '#666' }}>We'll contact you soon with delivery details.</p>
          </div>
        )}
      </ReactModal>
    </>
  );
};

export default Navbar; 