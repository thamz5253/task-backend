#!/usr/bin/env node

const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');

class TestRunner {
  constructor() {
    this.serverProcess = null;
    this.baseUrl = 'http://localhost:3001';
    this.maxRetries = 30;
    this.retryDelay = 1000;
  }

  async startServer() {
    console.log('🚀 Starting test server...');
    
    // Set environment variables for testing
    const env = {
      ...process.env,
      NODE_ENV: 'test',
      PORT: '3001',
      MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/task-manager-test'
    };

    // Start the server process
    this.serverProcess = spawn('node', ['dist/index.js'], {
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.resolve(__dirname, '..')
    });

    // Handle server output
    this.serverProcess.stdout.on('data', (data) => {
      if (process.env.DEBUG) {
        console.log(`Server stdout: ${data}`);
      }
    });

    this.serverProcess.stderr.on('data', (data) => {
      if (process.env.DEBUG) {
        console.error(`Server stderr: ${data}`);
      }
    });

    // Wait for server to be ready
    await this.waitForServer();
    console.log('✅ Test server is ready');
  }

  async waitForServer() {
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        await axios.get(`${this.baseUrl}/health`, { timeout: 1000 });
        return;
      } catch (error) {
        if (i === this.maxRetries - 1) {
          throw new Error(`Server failed to start after ${this.maxRetries} attempts`);
        }
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
  }

  async runTests() {
    console.log('🧪 Running tests...');
    
    return new Promise((resolve, reject) => {
      const testProcess = spawn('npm', ['test'], {
        stdio: 'inherit',
        cwd: path.resolve(__dirname, '..'),
        env: {
          ...process.env,
          NODE_ENV: 'test'
        }
      });

      testProcess.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Tests completed successfully');
          resolve();
        } else {
          console.error(`❌ Tests failed with exit code ${code}`);
          reject(new Error(`Tests failed with exit code ${code}`));
        }
      });

      testProcess.on('error', (error) => {
        console.error('❌ Error running tests:', error);
        reject(error);
      });
    });
  }

  async stopServer() {
    if (this.serverProcess) {
      console.log('🛑 Stopping test server...');
      
      return new Promise((resolve) => {
        this.serverProcess.on('close', (code) => {
          console.log(`✅ Test server stopped with code ${code}`);
          resolve();
        });
        
        this.serverProcess.kill('SIGTERM');
        
        // Force kill after 5 seconds
        setTimeout(() => {
          if (this.serverProcess && !this.serverProcess.killed) {
            this.serverProcess.kill('SIGKILL');
            resolve();
          }
        }, 5000);
      });
    }
  }

  async run() {
    try {
      await this.startServer();
      await this.runTests();
    } catch (error) {
      console.error('❌ Test run failed:', error.message);
      process.exit(1);
    } finally {
      await this.stopServer();
    }
  }
}

// Run the test runner
if (require.main === module) {
  const runner = new TestRunner();
  runner.run();
}

module.exports = TestRunner;
