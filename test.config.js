// Test configuration
module.exports = {
  // Test environment variables
  env: {
    NODE_ENV: 'test',
    PORT: '3001',
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/task-manager-test',
    API_BASE_URL: 'http://localhost:3001/api'
  },
  
  // Test server configuration
  server: {
    port: 3001,
    host: 'localhost',
    healthCheckPath: '/health',
    maxStartupTime: 30000, // 30 seconds
    retryDelay: 1000 // 1 second
  },
  
  // Test timeouts
  timeouts: {
    test: 30000, // 30 seconds per test
    server: 60000, // 60 seconds for server startup
    cleanup: 10000 // 10 seconds for cleanup
  }
};
