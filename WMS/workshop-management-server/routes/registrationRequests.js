const express = require('express');
const bcrypt = require('bcryptjs');
const RegistrationRequest = require('../models/RegistrationRequest');
const User = require('../models/User');
const { sendEmail } = require('../config/email');

const router = express.Router();

// Submit registration request
router.post('/submit-request', async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    const { username, email, password, role, clubCode } = req.body;

    // Check if user already exists
    console.log('Checking for existing user...');
    let existingUser;
    if (role === 'admin') {
      // For admin, username or email must be unique globally
      existingUser = await User.findOne({
        $or: [
          { username },
          { email }
        ]
      });
      if (existingUser) {
        console.log('Existing admin found:', existingUser.username);
        return res.status(400).json({
          message: 'An admin account with this username or email already exists.'
        });
      }
    } else {
      // For club members, username/email+clubCode must be unique
      existingUser = await User.findOne({
        $or: [
          { username, clubCode },
          { email, clubCode }
        ]
      });
      if (existingUser) {
        console.log('Existing club member found:', existingUser.username);
        return res.status(400).json({
          message: 'A club member with this username or email already exists for this club.'
        });
      }
    }
    console.log('No existing user found');

    // Check if request already exists
    console.log('Checking for existing request...');
    const existingRequest = await RegistrationRequest.findOne({ 
      $or: [
        { username, clubCode },
        { email, clubCode }
      ],
      status: 'pending'
    });
    if (existingRequest) {
      console.log('Existing request found:', existingRequest.username);
      return res.status(400).json({ 
        message: 'A registration request is already pending for this user in this club.'
      });
    }
    console.log('No existing request found');

    // Hash password
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');

    // Determine request type and target email
    console.log('Determining request type and target email...');
    let requestType, targetEmail, rolesArray;
    
    if (role === 'admin') {
      console.log('Processing admin request...');
      requestType = 'admin';
      targetEmail = 'grocerystore9437@gmail.com'; // Updated email
      rolesArray = ['admin', 'clubMember'];
    } else {
      console.log('Processing member request...');
      requestType = 'member';
      // Find the club admin for this clubCode
      const clubAdmin = await User.findOne({ clubCode, roles: 'admin' });
      if (!clubAdmin) {
        return res.status(400).json({ message: 'No admin found for this club. Please contact the system administrator.' });
      }
      targetEmail = clubAdmin.email;
      rolesArray = ['clubMember'];
    }

    // Create registration request
    console.log('Creating registration request...');
    const registrationRequest = new RegistrationRequest({
      username,
      email,
      password: hashedPassword,
      roles: rolesArray,
      clubCode,
      requestType,
      systemAdminEmail: role === 'admin' ? targetEmail : undefined,
      clubAdminEmail: role === 'clubMember' ? targetEmail : undefined
    });

    console.log('Saving registration request...');
    await registrationRequest.save();
    console.log('Registration request saved successfully');

    // Send email notification
    console.log('Preparing email data...');
    const emailData = {
      ...registrationRequest.toObject(),
      requestId: registrationRequest._id
    };

    console.log('Sending email to:', targetEmail);
    let emailResult;
    try {
      if (role === 'admin') {
        emailResult = await sendEmail(targetEmail, 'adminRequest', emailData);
      } else {
        emailResult = await sendEmail(targetEmail, 'memberRequest', emailData);
      }
      console.log('Email result:', emailResult);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      emailResult = { success: false, error: emailError.message };
    }

    // Update email sent status
    if (emailResult.success) {
      console.log('Email sent successfully, updating status...');
      registrationRequest.emailSent = true;
      registrationRequest.emailSentAt = new Date();
      await registrationRequest.save();
    } else {
      console.log('Email failed to send:', emailResult.error);
    }

    console.log('Registration request completed successfully');
    res.status(201).json({ 
      message: 'Registration request submitted successfully. You will receive an email notification once your request is approved.',
      requestId: registrationRequest._id
    });

  } catch (error) {
    console.error('Registration request error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
});

// Get pending requests (for admin dashboard)
router.get('/pending-requests', async (req, res) => {
  try {
    const { userRole, clubCode } = req.query;
    
    let query = { status: 'pending' };
    
    // System admin can see all admin requests
    if (userRole === 'systemAdmin') {
      query.requestType = 'admin';
    }
    // Club admin can see member requests for their club
    else if (userRole === 'admin') {
      query.requestType = 'member';
      query.clubCode = clubCode;
    }
    
    const requests = await RegistrationRequest.find(query)
      .sort({ createdAt: -1 })
      .select('-password'); // Don't send password
    
    res.json(requests);
  } catch (error) {
    console.error('Get pending requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve registration request
router.put('/approve/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { approvedBy } = req.body;

    const request = await RegistrationRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Registration request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been processed' });
    }

    if (approvedBy === 'systemAdmin' && request.requestType !== 'admin') {
      return res.status(403).json({ message: 'System admin can only approve admin requests' });
    }

    if (approvedBy === 'clubAdmin' && request.requestType !== 'member') {
      return res.status(403).json({ message: 'Club admin can only approve member requests' });
    }

    // Update request status
    request.status = 'approved';
    request.approvedBy = approvedBy;
    request.approvedAt = new Date();
    await request.save();

    // Create or update user account
    let user = await User.findOne({ username: request.username, clubCode: request.clubCode });
    if (user) {
      // Add new roles if not present
      if (request.roles.includes('admin')) {
        if (!user.roles.includes('admin')) user.roles.push('admin');
        if (!user.roles.includes('clubMember')) user.roles.push('clubMember');
      } else if (request.roles.includes('clubMember')) {
        if (!user.roles.includes('clubMember')) user.roles.push('clubMember');
      }
      await user.save();
    } else {
      let rolesToSet = request.roles.includes('admin') ? ['admin', 'clubMember'] : ['clubMember'];
      user = new User({
        username: request.username,
        email: request.email,
        password: request.password, // Already hashed
        roles: rolesToSet,
        clubCode: request.clubCode
      });
      await user.save();
    }

    // Send approval notification email
    const emailData = {
      username: request.username,
      email: request.email,
      role: request.role,
      clubCode: request.clubCode
    };

    await sendEmail(request.email, 'approvalNotification', emailData);

    // Return user info with roles
    res.json({ 
      message: 'Registration request approved successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        roles: user.roles,
        clubCode: user.clubCode
      }
    });

  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject registration request
router.put('/reject/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { rejectedBy, rejectionReason } = req.body;

    const request = await RegistrationRequest.findById(requestId);
    if (!request) {
      return res.status(404).json({ message: 'Registration request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Request has already been processed' });
    }

    // Update request status
    request.status = 'rejected';
    request.approvedBy = rejectedBy; // Reusing field for rejectedBy
    request.approvedAt = new Date(); // Reusing field for rejectedAt
    request.rejectionReason = rejectionReason;
    await request.save();

    // Send rejection notification email
    const emailData = {
      username: request.username,
      email: request.email,
      role: request.role,
      clubCode: request.clubCode
    };

    await sendEmail(request.email, 'approvalNotification', emailData);

    res.json({ message: 'Registration request rejected successfully' });

  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get request status
router.get('/status/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const request = await RegistrationRequest.findById(requestId)
      .select('-password');
    
    if (!request) {
      return res.status(404).json({ message: 'Registration request not found' });
    }
    
    res.json(request);
  } catch (error) {
    console.error('Get request status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 