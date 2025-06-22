import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ searchQuery, onSearchChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

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
        <div className="search-container">
          <div className="search-bar">
            <span className="search-icon material-icons">search</span>
            <input
              type="text"
              placeholder="Search for restaurants, cuisines or dishes..."
              value={searchQuery}
              onChange={onSearchChange}
            />
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar; 