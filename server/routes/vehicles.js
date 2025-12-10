const express = require('express');
const { body, validationResult } = require('express-validator');
const { query, queryOne, execute } = require('../database/db-adapter');

const router = express.Router();

// Get all vehicles
router.get('/', async (req, res) => {
  try {
    const { status, category } = req.query;
    let queryStr = 'SELECT * FROM vehicles WHERE 1=1';
    const params = [];

    if (status) {
      queryStr += ' AND status = ?';
      params.push(status);
    }
    if (category) {
      queryStr += ' AND category = ?';
      params.push(category);
    }

    queryStr += ' ORDER BY created_at DESC';

    const vehicles = await query(queryStr, params);
    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Error fetching vehicles' });
  }
});

// Get vehicle by ID
router.get('/:id', async (req, res) => {
  try {
    const vehicle = await queryOne('SELECT * FROM vehicles WHERE id = ?', [req.params.id]);

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json(vehicle);
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({ error: 'Error fetching vehicle' });
  }
});

// Create new vehicle
router.post('/',
  [
    body('brand').notEmpty().withMessage('Brand is required'),
    body('model').notEmpty().withMessage('Model is required'),
    body('year').isInt({ min: 1900, max: 2100 }).withMessage('Valid year is required'),
    body('license_plate').notEmpty().withMessage('License plate is required'),
    body('vin').notEmpty().withMessage('VIN is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('daily_rate').isFloat({ min: 0 }).withMessage('Valid daily rate is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      brand, model, year, color, license_plate, vin, category,
      transmission, fuel_type, seats, daily_rate, status, mileage, image_url
    } = req.body;

    try {
      const result = await execute(
        `INSERT INTO vehicles (brand, model, year, color, license_plate, vin, category,
         transmission, fuel_type, seats, daily_rate, status, mileage, image_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [brand, model, year, color, license_plate, vin, category, transmission,
         fuel_type, seats, daily_rate, status || 'available', mileage || 0, image_url]
      );

      res.status(201).json({
        message: 'Vehicle created successfully',
        vehicleId: result.lastID || result.rows?.[0]?.id
      });
    } catch (error) {
      if (error.message?.includes('UNIQUE') || error.code === '23505') {
        return res.status(400).json({ error: 'License plate or VIN already exists' });
      }
      console.error('Error creating vehicle:', error);
      res.status(500).json({ error: 'Error creating vehicle' });
    }
  }
);

// Update vehicle
router.put('/:id', async (req, res) => {
  const {
    brand, model, year, color, license_plate, vin, category,
    transmission, fuel_type, seats, daily_rate, status, mileage, image_url
  } = req.body;

  try {
    const result = await execute(
      `UPDATE vehicles SET brand = ?, model = ?, year = ?, color = ?, license_plate = ?,
       vin = ?, category = ?, transmission = ?, fuel_type = ?, seats = ?, daily_rate = ?,
       status = ?, mileage = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [brand, model, year, color, license_plate, vin, category, transmission,
       fuel_type, seats, daily_rate, status, mileage, image_url, req.params.id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json({ message: 'Vehicle updated successfully' });
  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({ error: 'Error updating vehicle' });
  }
});

// Delete vehicle
router.delete('/:id', async (req, res) => {
  try {
    const result = await execute('DELETE FROM vehicles WHERE id = ?', [req.params.id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ error: 'Error deleting vehicle' });
  }
});

module.exports = router;
