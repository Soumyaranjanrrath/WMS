const express = require('express');
const WorkshopRequest = require('../models/WorkshopRequest');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Submit workshop request (Club members only)
router.post('/submit', authMiddleware, async (req, res) => {
  try {
    const { workshopName, date, time, location, topic, description, maxParticipants } = req.body;
    const { userId, username, role, clubCode } = req.user;

    // Check if user is a club member
    if (role !== 'clubMember') {
      return res.status(403).json({ message: 'Only club members can submit workshop requests' });
    }

    const workshopRequest = new WorkshopRequest({
      requesterId: userId,
      requesterName: username,
      requesterRole: role,
      clubCode,
      workshopName,
      date,
      time,
      location,
      topic,
      description,
      maxParticipants
    });

    await workshopRequest.save();

    res.status(201).json({ 
      message: 'Workshop request submitted successfully',
      requestId: workshopRequest._id
    });
  } catch (error) {
    console.error('Submit request error:', error);
    res.status(500).json({ message: 'Failed to submit workshop request' });
  }
});

// Get workshop requests (Admin can see all, Club members see their own)
router.get('/requests', authMiddleware, async (req, res) => {
  try {
    const { userId, role, clubCode } = req.user;
    let requests;

    if (role === 'admin') {
      // Admin can see all requests from their club
      requests = await WorkshopRequest.find({ clubCode }).sort({ createdAt: -1 });
    } else {
      // Club members can only see their own requests
      requests = await WorkshopRequest.find({ requesterId: userId }).sort({ createdAt: -1 });
    }

    res.json(requests);
  } catch (error) {
    console.error('Get requests error:', error);
    res.status(500).json({ message: 'Failed to fetch workshop requests' });
  }
});

// Approve workshop request (Admin only)
router.put('/approve/:requestId', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { userId, username, role, clubCode } = req.user;
    const { adminResponse } = req.body;

    // Check if user is admin
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can approve workshop requests' });
    }

    const request = await WorkshopRequest.findById(requestId);
    
    if (!request) {
      return res.status(404).json({ message: 'Workshop request not found' });
    }

    // Check if admin belongs to the same club
    if (request.clubCode !== clubCode) {
      return res.status(403).json({ message: 'You can only approve requests from your club' });
    }

    request.status = 'approved';
    request.adminId = userId;
    request.adminName = username;
    request.adminResponse = adminResponse || 'Request approved';
    request.updatedAt = new Date();

    await request.save();

    res.json({ 
      message: 'Workshop request approved successfully',
      request: request
    });
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ message: 'Failed to approve workshop request' });
  }
});

// Reject workshop request (Admin only)
router.put('/reject/:requestId', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { userId, username, role, clubCode } = req.user;
    const { adminResponse } = req.body;

    // Check if user is admin
    if (role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can reject workshop requests' });
    }

    const request = await WorkshopRequest.findById(requestId);
    
    if (!request) {
      return res.status(404).json({ message: 'Workshop request not found' });
    }

    // Check if admin belongs to the same club
    if (request.clubCode !== clubCode) {
      return res.status(403).json({ message: 'You can only reject requests from your club' });
    }

    request.status = 'rejected';
    request.adminId = userId;
    request.adminName = username;
    request.adminResponse = adminResponse || 'Request rejected';
    request.updatedAt = new Date();

    await request.save();

    res.json({ 
      message: 'Workshop request rejected',
      request: request
    });
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ message: 'Failed to reject workshop request' });
  }
});

// Get request statistics
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const { userId, role, clubCode } = req.user;
    let stats;

    if (role === 'admin') {
      // Admin stats for their club
      const totalRequests = await WorkshopRequest.countDocuments({ clubCode });
      const pendingRequests = await WorkshopRequest.countDocuments({ clubCode, status: 'pending' });
      const approvedRequests = await WorkshopRequest.countDocuments({ clubCode, status: 'approved' });
      const rejectedRequests = await WorkshopRequest.countDocuments({ clubCode, status: 'rejected' });

      stats = {
        total: totalRequests,
        pending: pendingRequests,
        approved: approvedRequests,
        rejected: rejectedRequests
      };
    } else {
      // Club member stats for their own requests
      const totalRequests = await WorkshopRequest.countDocuments({ requesterId: userId });
      const pendingRequests = await WorkshopRequest.countDocuments({ requesterId: userId, status: 'pending' });
      const approvedRequests = await WorkshopRequest.countDocuments({ requesterId: userId, status: 'approved' });
      const rejectedRequests = await WorkshopRequest.countDocuments({ requesterId: userId, status: 'rejected' });

      stats = {
        total: totalRequests,
        pending: pendingRequests,
        approved: approvedRequests,
        rejected: rejectedRequests
      };
    }

    res.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Failed to fetch request statistics' });
  }
});

module.exports = router; 