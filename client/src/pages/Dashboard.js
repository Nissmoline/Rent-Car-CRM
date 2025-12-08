import React, { useState, useEffect } from 'react';
import { getDashboardStats, getRecentBookings, getRevenueChart } from '../services/api';
import { FaCar, FaUsers, FaCalendarAlt, FaDollarSign } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, bookingsRes, revenueRes] = await Promise.all([
        getDashboardStats(),
        getRecentBookings(),
        getRevenueChart(),
      ]);
      setStats(statsRes.data);
      setRecentBookings(bookingsRes.data);
      setRevenueData(revenueRes.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      confirmed: 'badge-info',
      active: 'badge-success',
      completed: 'badge-secondary',
      cancelled: 'badge-danger',
    };
    return `badge ${badges[status] || 'badge-secondary'}`;
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <h1 className="page-title">Dashboard</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#3b82f6' }}>
            <FaCar />
          </div>
          <div className="stat-content">
            <h3>Total Vehicles</h3>
            <p className="stat-number">{stats?.totalVehicles || 0}</p>
            <p className="stat-detail">
              {stats?.availableVehicles || 0} available, {stats?.rentedVehicles || 0} rented
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#10b981' }}>
            <FaUsers />
          </div>
          <div className="stat-content">
            <h3>Total Customers</h3>
            <p className="stat-number">{stats?.totalCustomers || 0}</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#f59e0b' }}>
            <FaCalendarAlt />
          </div>
          <div className="stat-content">
            <h3>Active Bookings</h3>
            <p className="stat-number">{stats?.activeBookings || 0}</p>
            <p className="stat-detail">{stats?.pendingBookings || 0} pending</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#8b5cf6' }}>
            <FaDollarSign />
          </div>
          <div className="stat-content">
            <h3>Monthly Revenue</h3>
            <p className="stat-number">{formatCurrency(stats?.monthlyRevenue || 0)}</p>
            <p className="stat-detail">
              Total: {formatCurrency(stats?.totalRevenue || 0)}
            </p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="chart-section card">
          <h2>Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="recent-bookings card">
          <h2>Recent Bookings</h2>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Vehicle</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentBookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>{`${booking.first_name} ${booking.last_name}`}</td>
                    <td>{`${booking.brand} ${booking.model}`}</td>
                    <td>{new Date(booking.start_date).toLocaleDateString()}</td>
                    <td>{new Date(booking.end_date).toLocaleDateString()}</td>
                    <td>{formatCurrency(booking.total_amount)}</td>
                    <td>
                      <span className={getStatusBadge(booking.status)}>
                        {booking.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
