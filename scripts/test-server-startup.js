#!/usr/bin/env node

const { TestServer } = require('../test/server-setup');

async function testServerStartup() {
  console.log('🧪 Testing server startup...');
  
  const server = new TestServer();
  
  try {
    await server.start();
    console.log('✅ Server startup test passed!');
    
    // Test health endpoint
    const axios = require('axios');
    const response = await axios.get('http://localhost:3001/health');
    console.log('✅ Health endpoint test passed!', response.data);
    
  } catch (error) {
    console.error('❌ Server startup test failed:', error.message);
    process.exit(1);
  } finally {
    await server.stop();
    console.log('✅ Server stopped successfully');
  }
}

// Run the test
if (require.main === module) {
  testServerStartup()
    .then(() => {
      console.log('🎉 All tests passed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test failed:', error.message);
      process.exit(1);
    });
}

module.exports = testServerStartup;
