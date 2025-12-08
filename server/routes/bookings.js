const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all bookings
router.get('/', authenticateToken, (req, res) => {
  const { status } = req.query;
  let query = `
    SELECT b.*,
           c.first_name, c.last_name, c.email, c.phone,
           v.brand, v.model, v.license_plate, v.category
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
    JOIN vehicles v ON b.vehicle_id = v.id
    WHERE 1=1
  `;
  const params = [];

  if (status) {
    query += ' AND b.status = ?';
    params.push(status);
  }

  query += ' ORDER BY b.created_at DESC';

  db.all(query, params, (err, bookings) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching bookings' });
    }
    res.json(bookings);
  });
});

// Get booking by ID
router.get('/:id', authenticateToken, (req, res) => {
  const query = `
    SELECT b.*,
           c.first_name, c.last_name, c.email, c.phone, c.license_number,
           v.brand, v.model, v.license_plate, v.category, v.daily_rate
    FROM bookings b
    JOIN customers c ON b.customer_id = c.id
    JOIN vehicles v ON b.vehicle_id = v.id
    WHERE b.id = ?
  `;

  db.get(query, [req.params.id], (err, booking) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching booking' });
    }
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(booking);
  });
});

// Get booking payments
router.get('/:id/payments', authenticateToken, (req, res) => {
  db.all(
    'SELECT * FROM payments WHERE booking_id = ? ORDER BY payment_date DESC',
    [req.params.id],
    (err, payments) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching payments' });
      }
      res.json(payments);
    }
  );
});

// Create new booking
router.post('/',
  authenticateToken,
  [
    body('customer_id').isInt().withMessage('Valid customer ID is required'),
    body('vehicle_id').isInt().withMessage('Valid vehicle ID is required'),
    body('start_date').isISO8601().withMessage('Valid start date is required'),
    body('end_date').isISO8601().withMessage('Valid end date is required'),
    body('pickup_location').notEmpty().withMessage('Pickup location is required'),
    body('return_location').notEmpty().withMessage('Return location is required'),
    body('total_amount').isFloat({ min: 0 }).withMessage('Valid total amount is required'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      customer_id, vehicle_id, start_date, end_date,
      pickup_location, return_location, total_amount, notes, status
    } = req.body;

    // Check if vehicle is available
    const availabilityQuery = `
      SELECT COUNT(*) as count FROM bookings
      WHERE vehicle_id = ? AND status IN ('pending', 'confirmed', 'active')
      AND ((start_date <= ? AND end_date >= ?) OR (start_date <= ? AND end_date >= ?))
    `;

    db.get(
      availabilityQuery,
      [vehicle_id, end_date, start_date, start_date, end_date],
      (err, result) => {
        if (err) {
          return res.status(500).json({ error: 'Error checking availability' });
        }
        if (result.count > 0) {
          return res.status(400).json({ error: 'Vehicle is not available for selected dates' });
        }

        db.run(
          `INSERT INTO bookings (customer_id, vehicle_id, start_date, end_date,
           pickup_location, return_location, total_amount, status, notes, created_by)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [customer_id, vehicle_id, start_date, end_date, pickup_location, return_location,
           total_amount, status || 'pending', notes, req.user.id],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Error creating booking' });
            }
            res.status(201).json({ message: 'Booking created successfully', bookingId: this.lastID });
          }
        );
      }
    );
  }
);

// Update booking
router.put('/:id', authenticateToken, (req, res) => {
  const {
    customer_id, vehicle_id, start_date, end_date,
    pickup_location, return_location, total_amount, paid_amount, status, notes
  } = req.body;

  db.run(
    `UPDATE bookings SET customer_id = ?, vehicle_id = ?, start_date = ?, end_date = ?,
     pickup_location = ?, return_location = ?, total_amount = ?, paid_amount = ?,
     status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [customer_id, vehicle_id, start_date, end_date, pickup_location, return_location,
     total_amount, paid_amount, status, notes, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error updating booking' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Booking not found' });
      }

      // Update vehicle status based on booking status
      if (status === 'active') {
        db.run('UPDATE vehicles SET status = ? WHERE id = ?', ['rented', vehicle_id]);
      } else if (status === 'completed' || status === 'cancelled') {
        db.run('UPDATE vehicles SET status = ? WHERE id = ?', ['available', vehicle_id]);
      }

      res.json({ message: 'Booking updated successfully' });
    }
  );
});

// Delete booking
router.delete('/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM bookings WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error deleting booking' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json({ message: 'Booking deleted successfully' });
  });
});

module.exports = router;
