const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, queryOne, execute } = require('../database/db-adapter');

const router = express.Router();

// Get all bookings
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let queryStr = `
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
      queryStr += ' AND b.status = ?';
      params.push(status);
    }

    queryStr += ' ORDER BY b.created_at DESC';

    const bookings = await query(queryStr, params);
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Error fetching bookings' });
  }
});

// Get booking by ID
router.get('/:id', async (req, res) => {
  try {
    const queryStr = `
      SELECT b.*,
             c.first_name, c.last_name, c.email, c.phone, c.license_number,
             v.brand, v.model, v.license_plate, v.category, v.daily_rate
      FROM bookings b
      JOIN customers c ON b.customer_id = c.id
      JOIN vehicles v ON b.vehicle_id = v.id
      WHERE b.id = ?
    `;

    const booking = await queryOne(queryStr, [req.params.id]);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ error: 'Error fetching booking' });
  }
});

// Get booking payments
router.get('/:id/payments', async (req, res) => {
  try {
    const payments = await query(
      'SELECT * FROM payments WHERE booking_id = ? ORDER BY payment_date DESC',
      [req.params.id]
    );
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Error fetching payments' });
  }
});

// Create new booking
router.post('/',
  [
    body('customer_id').isInt().withMessage('Valid customer ID is required'),
    body('vehicle_id').isInt().withMessage('Valid vehicle ID is required'),
    body('start_date').isISO8601().withMessage('Valid start date is required'),
    body('end_date').isISO8601().withMessage('Valid end date is required'),
    body('pickup_location').notEmpty().withMessage('Pickup location is required'),
    body('return_location').notEmpty().withMessage('Return location is required'),
    body('total_amount').isFloat({ min: 0 }).withMessage('Valid total amount is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      customer_id, vehicle_id, start_date, end_date,
      pickup_location, return_location, total_amount, notes, status
    } = req.body;

    try {
      // Check if vehicle is available
      const availabilityQuery = `
        SELECT COUNT(*) as count FROM bookings
        WHERE vehicle_id = ? AND status IN ('pending', 'confirmed', 'active')
        AND ((start_date <= ? AND end_date >= ?) OR (start_date <= ? AND end_date >= ?))
      `;

      const result = await queryOne(
        availabilityQuery,
        [vehicle_id, end_date, start_date, start_date, end_date]
      );

      if (result.count > 0) {
        return res.status(400).json({ error: 'Vehicle is not available for selected dates' });
      }

      const insertResult = await execute(
        `INSERT INTO bookings (customer_id, vehicle_id, start_date, end_date,
         pickup_location, return_location, total_amount, status, notes, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [customer_id, vehicle_id, start_date, end_date, pickup_location, return_location,
         total_amount, status || 'pending', notes, null]
      );

      res.status(201).json({
        message: 'Booking created successfully',
        bookingId: insertResult.lastID || insertResult.rows?.[0]?.id
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(500).json({ error: 'Error creating booking' });
    }
  }
);

// Update booking
router.put('/:id', async (req, res) => {
  const {
    customer_id, vehicle_id, start_date, end_date,
    pickup_location, return_location, total_amount, paid_amount, status, notes
  } = req.body;

  try {
    const result = await execute(
      `UPDATE bookings SET customer_id = ?, vehicle_id = ?, start_date = ?, end_date = ?,
       pickup_location = ?, return_location = ?, total_amount = ?, paid_amount = ?,
       status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [customer_id, vehicle_id, start_date, end_date, pickup_location, return_location,
       total_amount, paid_amount, status, notes, req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Update vehicle status based on booking status
    if (status === 'active') {
      await execute('UPDATE vehicles SET status = ? WHERE id = ?', ['rented', vehicle_id]);
    } else if (status === 'completed' || status === 'cancelled') {
      await execute('UPDATE vehicles SET status = ? WHERE id = ?', ['available', vehicle_id]);
    }

    res.json({ message: 'Booking updated successfully' });
  } catch (error) {
    console.error('Error updating booking:', error);
    res.status(500).json({ error: 'Error updating booking' });
  }
});

// Delete booking
router.delete('/:id', async (req, res) => {
  try {
    const result = await execute('DELETE FROM bookings WHERE id = ?', [req.params.id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    res.json({ message: 'Booking deleted successfully' });
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ error: 'Error deleting booking' });
  }
});

module.exports = router;
