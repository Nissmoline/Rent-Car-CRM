import React from 'react';
import { FaBars, FaUser, FaSignOutAlt } from 'react-icons/fa';
import './Navbar.css';

function Navbar({ user, onLogout, toggleSidebar }) {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button className="menu-btn" onClick={toggleSidebar}>
          <FaBars />
        </button>
        <h1 className="navbar-title">Rent Car CRM</h1>
      </div>
      <div className="navbar-right">
        <div className="user-info">
          <FaUser />
          <span>{user?.username}</span>
          <span className="user-role">({user?.role})</span>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          <FaSignOutAlt />
          Logout
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
