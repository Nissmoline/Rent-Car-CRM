const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all payments
router.get('/', authenticateToken, (req, res) => {
  const query = `
    SELECT p.*,
           b.id as booking_id,
           c.first_name, c.last_name,
           v.brand, v.model
    FROM payments p
    JOIN bookings b ON p.booking_id = b.id
    JOIN customers c ON b.customer_id = c.id
    JOIN vehicles v ON b.vehicle_id = v.id
    ORDER BY p.payment_date DESC
  `;

  db.all(query, [], (err, payments) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching payments' });
    }
    res.json(payments);
  });
});

// Create new payment
router.post('/',
  authenticateToken,
  [
    body('booking_id').isInt().withMessage('Valid booking ID is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
    body('payment_method').notEmpty().withMessage('Payment method is required'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { booking_id, amount, payment_method, transaction_id, notes } = req.body;

    db.run(
      `INSERT INTO payments (booking_id, amount, payment_method, transaction_id, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [booking_id, amount, payment_method, transaction_id, notes],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Error creating payment' });
        }

        // Update booking paid_amount
        db.run(
          'UPDATE bookings SET paid_amount = paid_amount + ? WHERE id = ?',
          [amount, booking_id],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Error updating booking' });
            }
            res.status(201).json({ message: 'Payment recorded successfully', paymentId: this.lastID });
          }
        );
      }
    );
  }
);

// Delete payment
router.delete('/:id', authenticateToken, (req, res) => {
  // First get the payment details
  db.get('SELECT * FROM payments WHERE id = ?', [req.params.id], (err, payment) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching payment' });
    }
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Delete the payment
    db.run('DELETE FROM payments WHERE id = ?', [req.params.id], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error deleting payment' });
      }

      // Update booking paid_amount
      db.run(
        'UPDATE bookings SET paid_amount = paid_amount - ? WHERE id = ?',
        [payment.amount, payment.booking_id],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Error updating booking' });
          }
          res.json({ message: 'Payment deleted successfully' });
        }
      );
    });
  });
});

module.exports = router;
