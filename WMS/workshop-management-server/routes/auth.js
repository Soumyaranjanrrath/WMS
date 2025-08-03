const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  const { username, email, password, role, clubCode } = req.body;
  try {
    // Check if user already exists with same username/email and clubCode
    let user = await User.findOne({ 
      $or: [
        { username, clubCode },
        { email, clubCode }
      ]
    });
    if (user) {
      // If role already present, reject
      if (user.roles.includes(role)) {
        return res.status(400).json({ 
          message: 'User with this role already exists for this club.'
        });
      }
      // Add new role to roles array
      user.roles.push(role);
      await user.save();
      return res.status(200).json({ message: 'Role added to existing user for this club.' });
    }

    // If user is trying to register as admin, check if admin already exists for this club
    if (role === 'admin') {
      const existingAdmin = await User.findOne({ 
        roles: 'admin', 
        clubCode: clubCode 
      });
      if (existingAdmin) {
        return res.status(400).json({ 
          message: 'An admin already exists for this club. Only one admin is allowed per club.' 
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ 
      username, 
      email, 
      password: hashedPassword, 
      roles: [role], 
      clubCode 
    });
    await user.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password, clubCode } = req.body;
  try {
    // Find user by username and clubCode
    const user = await User.findOne({ username, clubCode });
    if (!user) {
      return res.status(400).json({ 
        message: 'Invalid credentials. Please check your username, password, and club code.' 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        message: 'Invalid credentials. Please check your username, password, and club code.' 
      });
    }

    // Ensure roles is always an array
    const userRoles = Array.isArray(user.roles) ? user.roles : [];
    
    // Log user info for debugging (remove in production)
    console.log('Login attempt:', {
      username: user.username,
      clubCode: user.clubCode,
      roles: userRoles,
      hasAdminRole: userRoles.includes('admin'),
      hasClubMemberRole: userRoles.includes('clubMember')
    });

    const token = jwt.sign({ 
      userId: user._id, 
      username: user.username,
      roles: userRoles,
      clubCode: user.clubCode
    }, process.env.JWT_SECRET, { expiresIn: '24h' });
    
    res.json({ 
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        roles: userRoles,
        clubCode: user.clubCode
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Check if admin exists for a club
router.get('/check-admin/:clubCode', async (req, res) => {
  try {
    const { clubCode } = req.params;
    console.log('Checking admin for club code:', clubCode);
    
    const existingAdmin = await User.findOne({ 
      roles: 'admin', 
      clubCode: clubCode 
    });
    
    console.log('Database query result:', existingAdmin);
    
    if (existingAdmin) {
      console.log('Admin found:', existingAdmin.username);
      res.json({ 
        exists: true, 
        admin: {
          username: existingAdmin.username,
          email: existingAdmin.email,
          clubCode: existingAdmin.clubCode
        },
        message: 'Admin already exists for this club'
      });
    } else {
      console.log('No admin found for club code:', clubCode);
      res.json({ 
        exists: false, 
        message: 'No admin found for this club' 
      });
    }
  } catch (err) {
    console.error('Check admin error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;