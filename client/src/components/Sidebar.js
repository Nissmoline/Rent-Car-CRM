import React from 'react';
import { NavLink } from 'react-router-dom';
import { FaHome, FaCar, FaUsers, FaCalendarAlt, FaDollarSign } from 'react-icons/fa';
import './Sidebar.css';

function Sidebar({ isOpen }) {
  return (
    <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
      <nav className="sidebar-nav">
        <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FaHome />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/vehicles" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FaCar />
          <span>Vehicles</span>
        </NavLink>
        <NavLink to="/customers" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FaUsers />
          <span>Customers</span>
        </NavLink>
        <NavLink to="/bookings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FaCalendarAlt />
          <span>Bookings</span>
        </NavLink>
        <NavLink to="/payments" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
          <FaDollarSign />
          <span>Payments</span>
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;
