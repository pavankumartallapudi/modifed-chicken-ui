import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import ReactModal from 'react-modal';
import './RestaurantsPage.css';
import { useCart } from '../CartContext';
import ReviewSection from './ReviewSection';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import RestaurantCard from './RestaurantCard';

export default function FreshMeatPage() {
  const [freshMeat, setFreshMeat] = useState([]);
  const [search, setSearch] = useState('');
  const [menuModalParent, setMenuModalParent] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [dishSearch, setDishSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const { cart, addToCart: originalAddToCart, removeFromCart, clearCart } = useCart();
  const [checkoutStep, setCheckoutStep] = useState('cart');
  const [orderDetails, setOrderDetails] = useState({ name: '', phone: '', address: '' });
  const [orderId, setOrderId] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [showCartBar, setShowCartBar] = useState(false);

  ReactModal.setAppElement('#root');

  const addToCart = (dish) => {
    const cartItems = Object.values(cart);
    if (cartItems.length > 0 && cartItems[0].dish.parent_id !== dish.parent_id) {
      if (window.confirm('Your cart contains items from another meat shop. Would you like to clear it and add this item?')) {
        clearCart();
        originalAddToCart(dish);
      }
    } else {
      originalAddToCart(dish);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_items')
        .select('*')
        .eq('section', 'fresh-meat');
      setFreshMeat(data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUser(data?.user || null);
    });
  }, []);

  const openMenuModal = async (parent) => {
    setMenuModalParent(parent);
    setDishSearch('');
    const { data } = await supabase.from('dishes').select('*').eq('parent_id', parent.id);
    setDishes(data || []);
  };

  // Cart summary helpers
  const cartItems = Object.values(cart);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cartItems.reduce((sum, item) => sum + item.dish.price * item.quantity, 0);
  const cartMeatShop = freshMeat.find(m => m.id === cartItems[0]?.dish.parent_id);

  // Show cart bar when an item is added
  useEffect(() => {
    if (cartCount > 0) {
      setShowCartBar(true);
    } else {
      setShowCartBar(false);
    }
  }, [cartCount]);

  async function handleOrderSubmit(e) {
    e.preventDefault();
    // 1. Insert order
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
    // 2. Insert order_items
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

  // Reset checkout step when opening/closing cart modal
  useEffect(() => {
    if (cartModalOpen) setCheckoutStep('cart');
  }, [cartModalOpen]);

  return (
    <div className="register-bg food-bg-animate" style={{minHeight:'100vh', width:'100vw', position:'relative'}}>
      {/* 15 floating food SVGs for background, same as login/register */}
      {/* Donut */}
      <svg className="food-float food-float-1" width="48" height="48" viewBox="0 0 48 48" fill="none"><ellipse cx="24" cy="24" rx="20" ry="20" fill="#FDE68A" /><ellipse cx="24" cy="24" rx="14" ry="14" fill="#fff" /><ellipse cx="24" cy="24" rx="8" ry="8" fill="#F59E42" /><circle cx="24" cy="24" r="3" fill="#fff" /><path d="M18 18 Q24 20 30 18" stroke="#F59E42" strokeWidth="2" fill="none" /><path d="M18 30 Q24 28 30 30" stroke="#F59E42" strokeWidth="2" fill="none" /></svg>
      {/* Pizza Slice */}
      <svg className="food-float food-float-2" width="44" height="44" viewBox="0 0 44 44" fill="none"><path d="M22 6 L38 38 Q22 44 6 38 Z" fill="#FFD966" stroke="#B45309" strokeWidth="2" /><ellipse cx="22" cy="32" rx="10" ry="4" fill="#F59E42" /><circle cx="16" cy="28" r="2" fill="#B91C1C" /><circle cx="28" cy="30" r="2" fill="#B91C1C" /><circle cx="22" cy="36" r="1.5" fill="#B91C1C" /></svg>
      {/* Pie */}
      <svg className="food-float food-float-3" width="40" height="40" viewBox="0 0 40 40" fill="none"><ellipse cx="20" cy="28" rx="16" ry="8" fill="#F59E42" /><ellipse cx="20" cy="24" rx="14" ry="6" fill="#FFD966" /><ellipse cx="20" cy="22" rx="10" ry="4" fill="#fff" /><ellipse cx="20" cy="22" rx="4" ry="2" fill="#F59E42" /><path d="M8 28 Q20 34 32 28" stroke="#B45309" strokeWidth="2" fill="none" /></svg>
      {/* Burger */}
      <svg className="food-float food-float-4" width="38" height="38" viewBox="0 0 38 38" fill="none"><ellipse cx="19" cy="13" rx="15" ry="6" fill="#FFD966" stroke="#B45309" strokeWidth="1.5"/><rect x="6" y="18" width="26" height="8" rx="4" fill="#F59E42" stroke="#B45309" strokeWidth="1.5"/><ellipse cx="19" cy="28" rx="12" ry="4" fill="#A3E635" stroke="#15803D" strokeWidth="1.5"/></svg>
      {/* Croissant */}
      <svg className="food-float food-float-5" width="36" height="36" viewBox="0 0 36 36" fill="none"><ellipse cx="18" cy="18" rx="14" ry="7" fill="#FDE68A" stroke="#F59E42" strokeWidth="1.5"/><ellipse cx="18" cy="18" rx="8" ry="3" fill="#F59E42" /></svg>
      {/* Cupcake */}
      <svg className="food-float food-float-6" width="32" height="32" viewBox="0 0 32 32" fill="none"><ellipse cx="16" cy="24" rx="10" ry="4" fill="#FDE68A"/><ellipse cx="16" cy="20" rx="8" ry="3" fill="#fff"/><ellipse cx="16" cy="16" rx="6" ry="2" fill="#F59E42"/><ellipse cx="16" cy="12" rx="4" ry="1.5" fill="#B91C1C"/></svg>
      {/* Repeat and vary for 15 total */}
      <svg className="food-float food-float-7" width="32" height="32" viewBox="0 0 48 48" fill="none"><ellipse cx="24" cy="24" rx="20" ry="20" fill="#FDE68A" /><ellipse cx="24" cy="24" rx="14" ry="14" fill="#fff" /><ellipse cx="24" cy="24" rx="8" ry="8" fill="#F59E42" /><circle cx="24" cy="24" r="3" fill="#fff" /></svg>
      <svg className="food-float food-float-8" width="28" height="28" viewBox="0 0 44 44" fill="none"><path d="M22 6 L38 38 Q22 44 6 38 Z" fill="#FFD966" stroke="#B45309" strokeWidth="2" /></svg>
      <svg className="food-float food-float-9" width="30" height="30" viewBox="0 0 40 40" fill="none"><ellipse cx="20" cy="28" rx="16" ry="8" fill="#F59E42" /></svg>
      <svg className="food-float food-float-10" width="26" height="26" viewBox="0 0 38 38" fill="none"><ellipse cx="19" cy="13" rx="15" ry="6" fill="#FFD966" /></svg>
      <svg className="food-float food-float-11" width="24" height="24" viewBox="0 0 36 36" fill="none"><ellipse cx="18" cy="18" rx="14" ry="7" fill="#FDE68A" /></svg>
      <svg className="food-float food-float-12" width="22" height="22" viewBox="0 0 32 32" fill="none"><ellipse cx="16" cy="24" rx="10" ry="4" fill="#FDE68A"/></svg>
      <svg className="food-float food-float-13" width="36" height="36" viewBox="0 0 48 48" fill="none"><ellipse cx="24" cy="24" rx="20" ry="20" fill="#FDE68A" /></svg>
      <svg className="food-float food-float-14" width="28" height="28" viewBox="0 0 44 44" fill="none"><ellipse cx="22" cy="32" rx="10" ry="4" fill="#F59E42" /></svg>
      <svg className="food-float food-float-15" width="24" height="24" viewBox="0 0 40 40" fill="none"><ellipse cx="20" cy="22" rx="10" ry="4" fill="#fff" /></svg>
      {/* Main content */}
      <div style={{position:'relative', zIndex:2}}>
        <div className="category-search-bar" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span className="material-icons">search</span>
          <input
            type="text"
            placeholder="Search meat shops..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span style={{ marginLeft: 'auto', cursor: 'pointer', position: 'relative' }} onClick={() => setCartModalOpen(true)}>
            <span className="material-icons" style={{ fontSize: 28, color: '#ff4d5a' }}>shopping_cart</span>
            {cartCount > 0 && (
              <span style={{ position: 'absolute', top: -6, right: -8, background: '#ff4d5a', color: '#fff', borderRadius: '50%', fontSize: 13, padding: '2px 6px', fontWeight: 600 }}>{cartCount}</span>
            )}
          </span>
        </div>
        {loading ? (
          <div className="register-logo food-bounce" style={{ marginBottom: '12px', marginTop: '32px', display:'flex', justifyContent:'center' }}>
            <DotLottieReact
              src="/animations/loading.lottie"
              loop
              autoplay
              style={{ width: 180, height: 180 }}
            />
          </div>
        ) : (
          <div className="category-cards-grid">
            {freshMeat
              .filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
              .map((r, idx) => (
                <RestaurantCard key={idx} restaurant={r} onCardClick={() => openMenuModal(r)} />
              ))}
          </div>
        )}
      </div>
      <ReactModal
        isOpen={!!menuModalParent}
        onRequestClose={() => setMenuModalParent(null)}
        className="admin-menu-modal menu-modal-bg"
        overlayClassName="admin-menu-modal-overlay"
        contentLabel="Menu Modal"
      >
        <button className="admin-menu-modal-close" onClick={() => setMenuModalParent(null)}>&times;</button>
        <div style={{ overflowY: 'auto', height: 'calc(100% - 70px)'}}>
          {menuModalParent && (
            <>
              <h2 style={{textAlign: 'center', marginBottom: 12}}>{menuModalParent.name} Menu</h2>
              <div style={{textAlign: 'center', color: '#888', marginBottom: 18}}>{menuModalParent.location}</div>
              <input
                className="admin-dish-search"
                type="text"
                placeholder="Search dishes..."
                value={dishSearch}
                onChange={e => setDishSearch(e.target.value)}
                style={{marginBottom: 10, marginTop: 2, padding: '6px 10px', borderRadius: 6, border: '1px solid #eee', width: '90%'}}
              />
              <div className="admin-dashboard-dishes-cards">
                {dishes
                  .filter(dish =>
                    !dishSearch || dish.name.toLowerCase().includes(dishSearch.toLowerCase())
                  )
                  .map((dish, dIdx) => (
                    <div key={dIdx} className="admin-dashboard-dish-card">
                      <img src={dish.photo_url} alt={dish.name} className="admin-dashboard-dish-img" />
                      <div className="admin-dashboard-dish-info">
                        <div className="admin-dashboard-dish-name">{dish.name}</div>
                        <div className="admin-dashboard-dish-price">₹{dish.price}</div>
                        <div className="admin-dashboard-dish-actions">
                          {cart[dish.id]?.quantity > 0 ? (
                            <>
                              <button onClick={() => removeFromCart(dish)} style={{ padding: '2px 10px', fontSize: 20, borderRadius: 6, border: '1px solid #eee', background: '#fafbfc', cursor: cart[dish.id] ? 'pointer' : 'not-allowed', color: cart[dish.id] ? '#ff4d5a' : '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span className="material-icons">remove</span>
                              </button>
                              <span style={{ minWidth: 18, textAlign: 'center', fontWeight: 600 }}>{cart[dish.id]?.quantity}</span>
                              <button onClick={() => originalAddToCart(dish)} style={{ padding: '2px 10px', fontSize: 20, borderRadius: 6, border: '1px solid #eee', background: '#fafbfc', cursor: 'pointer', color: '#1a73e8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span className="material-icons">add</span>
                              </button>
                            </>
                          ) : (
                            <button className="add-btn" onClick={() => addToCart(dish)}>
                              Add
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
              <ReviewSection user={currentUser} restaurantId={menuModalParent.id} />
            </>
          )}
        </div>
        {showCartBar && cartCount > 0 && (
          <div className="cart-bottom-bar">
            <span className="cart-bar-left">{cartCount} Item{cartCount > 1 ? 's' : ''} added</span>
            <span className="cart-bar-right" onClick={() => setCartModalOpen(true)}>
              <span>View Cart</span>
              <span className="material-icons">chevron_right</span>
            </span>
          </div>
        )}
      </ReactModal>
      {/* Cart Modal */}
      <ReactModal
        isOpen={cartModalOpen}
        onRequestClose={() => setCartModalOpen(false)}
        className="admin-menu-modal cart-background"
        overlayClassName="admin-menu-modal-overlay"
        contentLabel="Cart Modal"
      >
        <button className="admin-menu-modal-close" onClick={() => setCartModalOpen(false)}>&times;</button>
        <h2 className="cart-title">Your Cart</h2>
        {cartMeatShop && <div className="cart-restaurant-name">{cartMeatShop.name}'s Meat Shop</div>}
        {checkoutStep === 'cart' && (
          cartItems.length === 0 ? (
            <div className="cart-empty-message">
              <DotLottieReact
                src="/animations/sad.lottie"
                loop
                autoplay
                style={{ width: 180, height: 180, marginBottom: 16 }}
              />
              <span>i am hungry, feed me</span>
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
                      <button className="quantity-btn" onClick={() => originalAddToCart(item.dish)}>
                        <span className="material-icons">add</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="cart-summary">
                <div className="cart-total">
                  <span>Total:</span>
                  <span className="total-amount">₹{cartTotal}</span>
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
    </div>
  );
}