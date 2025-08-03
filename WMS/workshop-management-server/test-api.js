const fetch = require('node-fetch');

async function testAdminCheckAPI() {
  console.log('🧪 Testing Admin Check API...\n');
  
  const testClubCodes = ['TEST123', 'CLUB001', 'NONEXISTENT'];
  
  for (const clubCode of testClubCodes) {
    try {
      console.log(`📡 Testing club code: ${clubCode}`);
      
      const response = await fetch(`http://localhost:5000/api/auth/check-admin/${clubCode}`);
      const data = await response.json();
      
      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Response:`, data);
      console.log('---');
      
    } catch (error) {
      console.log(`❌ Error for ${clubCode}:`, error.message);
      console.log('---');
    }
  }
  
  console.log('🎯 Test Complete!');
}

// Check if server is running
async function checkServerStatus() {
  try {
    console.log('🔍 Checking if server is running...');
    const response = await fetch('http://localhost:5000/api/auth/check-admin/TEST');
    console.log('✅ Server is running!');
    return true;
  } catch (error) {
    console.log('❌ Server is not running or not accessible');
    console.log('💡 Please start the server with: npm start');
    return false;
  }
}

async function runTests() {
  const serverRunning = await checkServerStatus();
  
  if (serverRunning) {
    await testAdminCheckAPI();
  }
}

runTests(); 