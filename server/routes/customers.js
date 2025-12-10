const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, queryOne, execute } = require('../database/db-adapter');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all customers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { search } = req.query;
    let queryStr = 'SELECT * FROM customers WHERE 1=1';
    const params = [];

    if (search) {
      queryStr += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    queryStr += ' ORDER BY created_at DESC';

    const customers = await query(queryStr, params);
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Error fetching customers' });
  }
});

// Get customer by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const customer = await queryOne('SELECT * FROM customers WHERE id = ?', [req.params.id]);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Error fetching customer' });
  }
});

// Get customer bookings
router.get('/:id/bookings', authenticateToken, async (req, res) => {
  try {
    const queryStr = `
      SELECT b.*, v.brand, v.model, v.license_plate
      FROM bookings b
      JOIN vehicles v ON b.vehicle_id = v.id
      WHERE b.customer_id = ?
      ORDER BY b.created_at DESC
    `;

    const bookings = await query(queryStr, [req.params.id]);
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Error fetching bookings' });
  }
});

// Create new customer
router.post('/',
  authenticateToken,
  [
    body('first_name').notEmpty().withMessage('First name is required'),
    body('last_name').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').notEmpty().withMessage('Phone is required'),
    body('license_number').notEmpty().withMessage('License number is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      first_name, last_name, email, phone, license_number,
      address, city, country, date_of_birth
    } = req.body;

    try {
      const result = await execute(
        `INSERT INTO customers (first_name, last_name, email, phone, license_number,
         address, city, country, date_of_birth)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [first_name, last_name, email, phone, license_number, address, city, country, date_of_birth]
      );

      res.status(201).json({
        message: 'Customer created successfully',
        customerId: result.lastID || result.rows?.[0]?.id
      });
    } catch (error) {
      if (error.message?.includes('UNIQUE') || error.code === '23505') {
        return res.status(400).json({ error: 'Email or license number already exists' });
      }
      console.error('Error creating customer:', error);
      res.status(500).json({ error: 'Error creating customer' });
    }
  }
);

// Update customer
router.put('/:id', authenticateToken, async (req, res) => {
  const {
    first_name, last_name, email, phone, license_number,
    address, city, country, date_of_birth
  } = req.body;

  try {
    const result = await execute(
      `UPDATE customers SET first_name = ?, last_name = ?, email = ?, phone = ?,
       license_number = ?, address = ?, city = ?, country = ?, date_of_birth = ?,
       updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [first_name, last_name, email, phone, license_number, address, city, country,
       date_of_birth, req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json({ message: 'Customer updated successfully' });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Error updating customer' });
  }
});

// Delete customer
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await execute('DELETE FROM customers WHERE id = ?', [req.params.id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Error deleting customer' });
  }
});

module.exports = router;
