const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB (update with your connection string)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/workshop-management';

async function fixSpecificUser(username, clubCode) {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the specific user
    const user = await User.findOne({ username, clubCode });
    
    if (!user) {
      console.log(`❌ User with username "${username}" and club code "${clubCode}" not found.`);
      return;
    }

    console.log(`\nFound user: ${user.username} (${user.email})`);
    console.log(`Current roles: ${JSON.stringify(user.roles)}`);
    console.log(`Club code: ${user.clubCode}`);

    // Check if user already has admin role
    if (user.roles.includes('admin')) {
      console.log('✅ User already has admin role.');
      return;
    }

    // Add admin role
    user.roles.push('admin');
    await user.save();
    
    console.log('✅ Successfully added admin role to user.');
    console.log(`Updated roles: ${JSON.stringify(user.roles)}`);

  } catch (error) {
    console.error('Error fixing user admin role:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Usage: Update these values with your actual admin user's details
const ADMIN_USERNAME = 'your_admin_username'; // Replace with actual username
const ADMIN_CLUB_CODE = 'your_club_code';     // Replace with actual club code

// Run the fix
fixSpecificUser(ADMIN_USERNAME, ADMIN_CLUB_CODE); 