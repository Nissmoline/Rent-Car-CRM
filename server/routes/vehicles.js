const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get all vehicles
router.get('/', authenticateToken, (req, res) => {
  const { status, category } = req.query;
  let query = 'SELECT * FROM vehicles WHERE 1=1';
  const params = [];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, vehicles) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching vehicles' });
    }
    res.json(vehicles);
  });
});

// Get vehicle by ID
router.get('/:id', authenticateToken, (req, res) => {
  db.get('SELECT * FROM vehicles WHERE id = ?', [req.params.id], (err, vehicle) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching vehicle' });
    }
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json(vehicle);
  });
});

// Create new vehicle
router.post('/',
  authenticateToken,
  [
    body('brand').notEmpty().withMessage('Brand is required'),
    body('model').notEmpty().withMessage('Model is required'),
    body('year').isInt({ min: 1900, max: 2100 }).withMessage('Valid year is required'),
    body('license_plate').notEmpty().withMessage('License plate is required'),
    body('vin').notEmpty().withMessage('VIN is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('daily_rate').isFloat({ min: 0 }).withMessage('Valid daily rate is required'),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      brand, model, year, color, license_plate, vin, category,
      transmission, fuel_type, seats, daily_rate, status, mileage, image_url
    } = req.body;

    db.run(
      `INSERT INTO vehicles (brand, model, year, color, license_plate, vin, category,
       transmission, fuel_type, seats, daily_rate, status, mileage, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [brand, model, year, color, license_plate, vin, category, transmission,
       fuel_type, seats, daily_rate, status || 'available', mileage || 0, image_url],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'License plate or VIN already exists' });
          }
          return res.status(500).json({ error: 'Error creating vehicle' });
        }
        res.status(201).json({ message: 'Vehicle created successfully', vehicleId: this.lastID });
      }
    );
  }
);

// Update vehicle
router.put('/:id', authenticateToken, (req, res) => {
  const {
    brand, model, year, color, license_plate, vin, category,
    transmission, fuel_type, seats, daily_rate, status, mileage, image_url
  } = req.body;

  db.run(
    `UPDATE vehicles SET brand = ?, model = ?, year = ?, color = ?, license_plate = ?,
     vin = ?, category = ?, transmission = ?, fuel_type = ?, seats = ?, daily_rate = ?,
     status = ?, mileage = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [brand, model, year, color, license_plate, vin, category, transmission,
     fuel_type, seats, daily_rate, status, mileage, image_url, req.params.id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error updating vehicle' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Vehicle not found' });
      }
      res.json({ message: 'Vehicle updated successfully' });
    }
  );
});

// Delete vehicle
router.delete('/:id', authenticateToken, (req, res) => {
  db.run('DELETE FROM vehicles WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error deleting vehicle' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json({ message: 'Vehicle deleted successfully' });
  });
});

module.exports = router;
