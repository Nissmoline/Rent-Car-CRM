const express = require('express');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/stats', authenticateToken, (req, res) => {
  const stats = {};

  // Total vehicles
  db.get('SELECT COUNT(*) as count FROM vehicles', [], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error fetching stats' });
    stats.totalVehicles = result.count;

    // Available vehicles
    db.get('SELECT COUNT(*) as count FROM vehicles WHERE status = ?', ['available'], (err, result) => {
      if (err) return res.status(500).json({ error: 'Error fetching stats' });
      stats.availableVehicles = result.count;

      // Rented vehicles
      db.get('SELECT COUNT(*) as count FROM vehicles WHERE status = ?', ['rented'], (err, result) => {
        if (err) return res.status(500).json({ error: 'Error fetching stats' });
        stats.rentedVehicles = result.count;

        // Total customers
        db.get('SELECT COUNT(*) as count FROM customers', [], (err, result) => {
          if (err) return res.status(500).json({ error: 'Error fetching stats' });
          stats.totalCustomers = result.count;

          // Active bookings
          db.get('SELECT COUNT(*) as count FROM bookings WHERE status IN (?, ?)',
            ['active', 'confirmed'], (err, result) => {
            if (err) return res.status(500).json({ error: 'Error fetching stats' });
            stats.activeBookings = result.count;

            // Pending bookings
            db.get('SELECT COUNT(*) as count FROM bookings WHERE status = ?', ['pending'], (err, result) => {
              if (err) return res.status(500).json({ error: 'Error fetching stats' });
              stats.pendingBookings = result.count;

              // Total revenue (this month)
              db.get(
                `SELECT SUM(amount) as revenue FROM payments
                 WHERE strftime('%Y-%m', payment_date) = strftime('%Y-%m', 'now')`,
                [],
                (err, result) => {
                  if (err) return res.status(500).json({ error: 'Error fetching stats' });
                  stats.monthlyRevenue = result.revenue || 0;

                  // Total revenue (all time)
                  db.get('SELECT SUM(amount) as revenue FROM payments', [], (err, result) => {
                    if (err) return res.status(500).json({ error: 'Error fetching stats' });
                    stats.totalRevenue = result.revenue || 0;

                    res.json(stats);
                  });
                }
              );
            });
          });
        });
      });
    });
  });
});

// Get recent bookings
router.get('/recent-bookings', authenticateToken, (req, res) => {
  const query = `
    SELECT b.id, b.start_date, b.end_date, b.status, b.total_amount,
           c.first_name, c.last_name,
           v.brand, v.model
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
    JOIN vehicles v ON b.vehicle_id = v.id
    ORDER BY b.created_at DESC
    LIMIT 10
  `;

  db.all(query, [], (err, bookings) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching recent bookings' });
    }
    res.json(bookings);
  });
});

// Get revenue by month (last 6 months)
router.get('/revenue-chart', authenticateToken, (req, res) => {
  const query = `
    SELECT strftime('%Y-%m', payment_date) as month, SUM(amount) as revenue
    FROM payments
    WHERE payment_date >= date('now', '-6 months')
    GROUP BY month
    ORDER BY month
  `;

  db.all(query, [], (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching revenue data' });
    }
    res.json(data);
  });
});

// Get popular vehicles
router.get('/popular-vehicles', authenticateToken, (req, res) => {
  const query = `
    SELECT v.id, v.brand, v.model, v.category, COUNT(b.id) as booking_count
    FROM vehicles v
    LEFT JOIN bookings b ON v.id = b.vehicle_id
    GROUP BY v.id
    ORDER BY booking_count DESC
    LIMIT 5
  `;

  db.all(query, [], (err, vehicles) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching popular vehicles' });
    }
    res.json(vehicles);
  });
});

module.exports = router;
