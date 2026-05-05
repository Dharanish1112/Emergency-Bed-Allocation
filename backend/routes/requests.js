const express = require('express');
const Request = require('../models/Request');
const router = express.Router();

// Get all requests
router.get('/', async (req, res) => {
  try {
    const { status, hospitalId, driverId } = req.query;
    
    let filter = {};
    if (status) filter.status = status;
    if (hospitalId) filter.hospitalId = hospitalId;
    if (driverId) filter.driverId = driverId;
    
    const requests = await Request.find(filter).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get requests for specific hospital
router.get('/hospital/:hospitalId', async (req, res) => {
  try {
    const requests = await Request.find({ 
      hospitalId: req.params.hospitalId 
    }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    console.error('Get hospital requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get requests for specific driver
router.get('/driver/:driverId', async (req, res) => {
  try {
    const requests = await Request.find({ 
      driverId: req.params.driverId 
    }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    console.error('Get driver requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Create new request
router.post('/', async (req, res) => {
  try {
    const requestData = req.body;
    
    // Check if request with same bookingId already exists
    const existingRequest = await Request.findOne({ bookingId: requestData.bookingId });
    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Request with this booking ID already exists'
      });
    }
    
    const request = new Request(requestData);
    await request.save();
    
    res.status(201).json({
      success: true,
      message: 'Request created successfully',
      request
    });
  } catch (error) {
    console.error('Create request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Update request status
router.put('/:bookingId/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'accepted', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    const request = await Request.findOneAndUpdate(
      { bookingId: req.params.bookingId },
      { 
        status,
        isNew: false,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Request status updated successfully',
      request
    });
  } catch (error) {
    console.error('Update request status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get request by booking ID
router.get('/:bookingId', async (req, res) => {
  try {
    const request = await Request.findOne({ bookingId: req.params.bookingId });
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }
    
    res.json({
      success: true,
      request
    });
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Delete request
router.delete('/:bookingId', async (req, res) => {
  try {
    const request = await Request.findOneAndDelete({ bookingId: req.params.bookingId });
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Request deleted successfully'
    });
  } catch (error) {
    console.error('Delete request error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Get request statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const stats = await Request.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const total = await Request.countDocuments();
    const today = await Request.countDocuments({
      createdAt: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0))
      }
    });
    
    res.json({
      success: true,
      stats: {
        total,
        today,
        byStatus: stats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
