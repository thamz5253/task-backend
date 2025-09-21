// Test setup file
// This file runs before all tests

// Increase timeout for all tests
jest.setTimeout(30000);

// Global test utilities
global.testUtils = {
  // Helper to wait for server to be ready
  waitForServer: async (url, maxAttempts = 30) => {
    const axios = require('axios');
    for (let i = 0; i < maxAttempts; i++) {
      try {
        await axios.get(url);
        return true;
      } catch (error) {
        if (i === maxAttempts - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
};

// Enhanced error handling for axios requests
const originalAxios = require('axios');
global.axios = originalAxios.create({
  timeout: 10000,
  validateStatus: function (status) {
    return status >= 200 && status < 600; // Accept all status codes for testing
  }
});

// Suppress console.log during tests unless DEBUG is set
if (!process.env.DEBUG) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}
