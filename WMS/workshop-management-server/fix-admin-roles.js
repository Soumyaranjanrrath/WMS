const mongoose = require('mongoose');
const User = require('./models/User');

// Connect to MongoDB (update with your connection string)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/workshop-management';

async function fixAdminRoles() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users
    const users = await User.find({});
    console.log(`Found ${users.length} users in the database`);

    let updatedCount = 0;

    for (const user of users) {
      console.log(`\nChecking user: ${user.username} (${user.email})`);
      console.log(`Current roles: ${JSON.stringify(user.roles)}`);
      console.log(`Club code: ${user.clubCode}`);

      // Check if this user should be an admin
      // You can customize this logic based on your criteria
      let shouldBeAdmin = false;

      // Option 1: If username contains 'admin' or email contains 'admin'
      if (user.username.toLowerCase().includes('admin') || 
          user.email.toLowerCase().includes('admin')) {
        shouldBeAdmin = true;
        console.log('  -> Detected as admin by username/email pattern');
      }

      // Option 2: If this is the only user for this clubCode, make them admin
      const usersInSameClub = await User.find({ clubCode: user.clubCode });
      if (usersInSameClub.length === 1 && user === usersInSameClub[0]) {
        shouldBeAdmin = true;
        console.log('  -> Detected as admin (only user in club)');
      }

      // Option 3: Manual check - you can add specific usernames here
      const adminUsernames = ['admin', 'administrator', 'superadmin']; // Add your admin usernames
      if (adminUsernames.includes(user.username.toLowerCase())) {
        shouldBeAdmin = true;
        console.log('  -> Detected as admin by username list');
      }

      if (shouldBeAdmin && !user.roles.includes('admin')) {
        // Add admin role if not present
        if (!user.roles.includes('admin')) {
          user.roles.push('admin');
          await user.save();
          console.log(`  ✅ Updated user ${user.username} to have admin role`);
          updatedCount++;
        }
      } else if (user.roles.includes('admin')) {
        console.log(`  ✅ User ${user.username} already has admin role`);
      } else {
        console.log(`  ℹ️  User ${user.username} is not an admin`);
      }
    }

    console.log(`\n🎉 Fix completed! Updated ${updatedCount} users with admin roles.`);

  } catch (error) {
    console.error('Error fixing admin roles:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the fix
fixAdminRoles(); 