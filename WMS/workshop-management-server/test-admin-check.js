const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB (make sure your .env file has MONGO_URI)
require('dotenv').config();

async function checkAdminExists(clubCode) {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    const existingAdmin = await User.findOne({ 
      role: 'admin', 
      clubCode: clubCode 
    });
    
    if (existingAdmin) {
      console.log(`✅ Admin EXISTS for club code: ${clubCode}`);
      console.log(`   Username: ${existingAdmin.username}`);
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Club Code: ${existingAdmin.clubCode}`);
    } else {
      console.log(`❌ NO ADMIN found for club code: ${clubCode}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Test with different club codes
async function runTests() {
  console.log('=== Admin Existence Check Tests ===\n');
  
  // Test with a club code that might have an admin
  await checkAdminExists('CLUB001');
  console.log('');
  
  // Test with another club code
  await checkAdminExists('1122');
  console.log('');
  
  // Test with a non-existent club code
  await checkAdminExists('NONEXISTENT');
  console.log('');
  
  console.log('=== Test Complete ===');
}

// Run the tests
runTests(); 