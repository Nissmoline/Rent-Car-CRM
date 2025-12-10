const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, queryOne, execute } = require('../database/db-adapter');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all payments
router.get('/', authenticateToken, async (req, res) => {
  try {
    const queryStr = `
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

    const payments = await query(queryStr, []);
    res.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ error: 'Error fetching payments' });
  }
});

// Create new payment
router.post('/',
  authenticateToken,
  [
    body('booking_id').isInt().withMessage('Valid booking ID is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
    body('payment_method').notEmpty().withMessage('Payment method is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { booking_id, amount, payment_method, transaction_id, notes } = req.body;

    try {
      const result = await execute(
        `INSERT INTO payments (booking_id, amount, payment_method, transaction_id, notes)
         VALUES (?, ?, ?, ?, ?)`,
        [booking_id, amount, payment_method, transaction_id, notes]
      );

      // Update booking paid_amount
      await execute(
        'UPDATE bookings SET paid_amount = paid_amount + ? WHERE id = ?',
        [amount, booking_id]
      );

      res.status(201).json({
        message: 'Payment recorded successfully',
        paymentId: result.lastID || result.rows?.[0]?.id
      });
    } catch (error) {
      console.error('Error creating payment:', error);
      res.status(500).json({ error: 'Error creating payment' });
    }
  }
);

// Delete payment
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    // First get the payment details
    const payment = await queryOne('SELECT * FROM payments WHERE id = ?', [req.params.id]);

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Delete the payment
    await execute('DELETE FROM payments WHERE id = ?', [req.params.id]);

    // Update booking paid_amount
    await execute(
      'UPDATE bookings SET paid_amount = paid_amount - ? WHERE id = ?',
      [payment.amount, payment.booking_id]
    );

    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ error: 'Error deleting payment' });
  }
});

module.exports = router;
