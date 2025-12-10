const express = require('express');
const { query, queryOne } = require('../database/db-adapter');

const router = express.Router();

// Get dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = {};

    // Total vehicles
    const totalVehicles = await queryOne('SELECT COUNT(*) as count FROM vehicles', []);
    stats.totalVehicles = totalVehicles.count;

    // Available vehicles
    const availableVehicles = await queryOne('SELECT COUNT(*) as count FROM vehicles WHERE status = ?', ['available']);
    stats.availableVehicles = availableVehicles.count;

    // Rented vehicles
    const rentedVehicles = await queryOne('SELECT COUNT(*) as count FROM vehicles WHERE status = ?', ['rented']);
    stats.rentedVehicles = rentedVehicles.count;

    // Total customers
    const totalCustomers = await queryOne('SELECT COUNT(*) as count FROM customers', []);
    stats.totalCustomers = totalCustomers.count;

    // Active bookings
    const activeBookings = await queryOne('SELECT COUNT(*) as count FROM bookings WHERE status IN (?, ?)', ['active', 'confirmed']);
    stats.activeBookings = activeBookings.count;

    // Pending bookings
    const pendingBookings = await queryOne('SELECT COUNT(*) as count FROM bookings WHERE status = ?', ['pending']);
    stats.pendingBookings = pendingBookings.count;

    // Total revenue (this month)
    const monthlyRevenue = await queryOne(
      `SELECT SUM(amount) as revenue FROM payments
       WHERE strftime('%Y-%m', payment_date) = strftime('%Y-%m', 'now')`,
      []
    );
    stats.monthlyRevenue = monthlyRevenue.revenue || 0;

    // Total revenue (all time)
    const totalRevenue = await queryOne('SELECT SUM(amount) as revenue FROM payments', []);
    stats.totalRevenue = totalRevenue.revenue || 0;

    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Error fetching stats' });
  }
});

// Get recent bookings
router.get('/recent-bookings', async (req, res) => {
  try {
    const queryStr = `
      SELECT b.id, b.start_date, b.end_date, b.status, b.total_amount,
             c.first_name, c.last_name,
             v.brand, v.model
      FROM bookings b
      JOIN customers c ON b.customer_id = c.id
      JOIN vehicles v ON b.vehicle_id = v.id
      ORDER BY b.created_at DESC
      LIMIT 10
    `;

    const bookings = await query(queryStr, []);
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching recent bookings:', error);
    res.status(500).json({ error: 'Error fetching recent bookings' });
  }
});

// Get revenue by month (last 6 months)
router.get('/revenue-chart', async (req, res) => {
  try {
    const queryStr = `
      SELECT strftime('%Y-%m', payment_date) as month, SUM(amount) as revenue
      FROM payments
      WHERE payment_date >= date('now', '-6 months')
      GROUP BY month
      ORDER BY month
    `;

    const data = await query(queryStr, []);
    res.json(data);
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    res.status(500).json({ error: 'Error fetching revenue data' });
  }
});

// Get popular vehicles
router.get('/popular-vehicles', async (req, res) => {
  try {
    const queryStr = `
      SELECT v.id, v.brand, v.model, v.category, COUNT(b.id) as booking_count
      FROM vehicles v
      LEFT JOIN bookings b ON v.id = b.vehicle_id
      GROUP BY v.id
      ORDER BY booking_count DESC
      LIMIT 5
    `;

    const vehicles = await query(queryStr, []);
    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching popular vehicles:', error);
    res.status(500).json({ error: 'Error fetching popular vehicles' });
  }
});

module.exports = router;
