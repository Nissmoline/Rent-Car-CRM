import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Vehicles from './pages/Vehicles';
import Customers from './pages/Customers';
import Bookings from './pages/Bookings';
import Payments from './pages/Payments';
import './App.css';

function App() {
  // Demo mode - always authenticated with demo user
  const [user] = useState({ username: 'Demo User', email: 'demo@rentcar.com', role: 'admin' });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    // In demo mode, logout just reloads the page
    window.location.reload();
  };

  return (
    <Router>
      <div className="app">
        <Navbar user={user} onLogout={handleLogout} toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <div className="app-container">
          <Sidebar isOpen={sidebarOpen} />
          <div className={`main-content ${sidebarOpen ? '' : 'sidebar-closed'}`}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/vehicles" element={<Vehicles />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/bookings" element={<Bookings />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}

export default App;
