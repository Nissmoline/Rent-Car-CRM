const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all customers
router.get('/', authenticateToken, (req, res) => {
  const { search } = req.query;
  let query = 'SELECT * FROM customers WHERE 1=1';
  const params = [];

  if (search) {
    query += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR phone LIKE ?)';
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam, searchParam);
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, customers) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching customers' });
    }
    res.json(customers);
  });
});

// Get customer by ID
router.get('/:id', authenticateToken, (req, res) => {
  db.get('SELECT * FROM customers WHERE id = ?', [req.params.id], (err, customer) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching customer' });
    }
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customer);
  });
});

// Get customer bookings
router.get('/:id/bookings', authenticateToken, (req, res) => {
  const query = `
    SELECT b.*, v.brand, v.model, v.license_plate
    FROM bookings b
    JOIN vehicles v ON b.vehicle_id = v.id
    WHERE b.customer_id = ?
    ORDER BY b.created_at DESC
  `;

  db.all(query, [req.params.id], (err, bookings) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching bookings' });
    }
    res.json(bookings);
  });
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
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      first_name, last_name, email, phone, license_number,
      address, city, country, date_of_birth
    } = req.body;

    db.run(
      `INSERT INTO customers (first_name, last_name, email, phone, license_number,
       address, city, country, date_of_birth)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [first_name, last_name, email, phone, license_number, address, city, country, date_of_birth],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Email or license number already exists' });
          }
          return res.status(500).json({ error: 'Error creating customer' });
        }
        res.status(201).json({ message: 'Customer created successfully', customerId: this.lastID });
      }
    );
  }
);

// Update customer
router.put('/:id', authenticateToken, (req, res) => {
  const {
    first_name, last_name, email, phone, license_number,
    address, city, country, date_of_birth
  } = req.body;

  db.run(
    `UPDATE customers SET first_name = ?, last_name = ?, email = ?, phone = ?,
     license_number = ?, address = ?, city = ?, country = ?, date_of_birth = ?,
     updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [first_name, last_name, email, phone, license_number, address, city, country,
     date_of_birth, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error updating customer' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      res.json({ message: 'Customer updated successfully' });
    }
  );
});

// Delete customer
router.delete('/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM customers WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error deleting customer' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json({ message: 'Customer deleted successfully' });
  });
});

module.exports = router;
