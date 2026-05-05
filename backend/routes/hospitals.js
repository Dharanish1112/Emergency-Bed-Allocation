const express = require('express');
const Hospital = require('../models/Hospital');
const router = express.Router();

// Get all hospitals
router.get('/', async (req, res) => {
  try {
    const { location } = req.query;
    
    let filter = { isActive: true };
    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }
    
    const hospitals = await Hospital.find(filter);
    
    res.json({
      success: true,
      count: hospitals.length,
      hospitals
    });
  } catch (error) {
    console.error('Get hospitals error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get hospital by ID
router.get('/:id', async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ id: req.params.id, isActive: true });
    
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }
    
    res.json({
      success: true,
      hospital
    });
  } catch (error) {
    console.error('Get hospital error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create hospital
router.post('/', async (req, res) => {
  try {
    const hospitalData = req.body;
    
    const hospital = new Hospital(hospitalData);
    await hospital.save();
    
    res.status(201).json({
      success: true,
      message: 'Hospital created successfully',
      hospital
    });
  } catch (error) {
    console.error('Create hospital error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update hospital
router.put('/:id', async (req, res) => {
  try {
    const hospital = await Hospital.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Hospital updated successfully',
      hospital
    });
  } catch (error) {
    console.error('Update hospital error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update hospital bed availability
router.put('/:id/beds', async (req, res) => {
  try {
    const { bedTypes } = req.body;
    
    const hospital = await Hospital.findOneAndUpdate(
      { id: req.params.id },
      { 
        bedTypes,
        bedsAvailable: Object.values(bedTypes).reduce((sum, count) => sum + count, 0)
      },
      { new: true, runValidators: true }
    );
    
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Bed availability updated successfully',
      hospital
    });
  } catch (error) {
    console.error('Update beds error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete hospital
router.delete('/:id', async (req, res) => {
  try {
    const hospital = await Hospital.findOneAndUpdate(
      { id: req.params.id },
      { isActive: false },
      { new: true }
    );
    
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Hospital deleted successfully'
    });
  } catch (error) {
    console.error('Delete hospital error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get unique locations
router.get('/locations/unique', async (req, res) => {
  try {
    const locations = await Hospital.distinct('location', { isActive: true });
    
    res.json({
      success: true,
      locations
    });
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
