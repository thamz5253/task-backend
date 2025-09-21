const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');

class TestServer {
  constructor() {
    this.serverProcess = null;
    this.baseUrl = 'http://localhost:3001';
    this.maxRetries = 30;
    this.retryDelay = 1000;
  }

  async start() {
    console.log('🚀 Starting test server...');
    
    // Check if dist/index.js exists
    const distPath = path.resolve(__dirname, '..', 'dist', 'index.js');
    const fs = require('fs');
    if (!fs.existsSync(distPath)) {
      throw new Error(`Build file not found: ${distPath}. Run 'npm run build' first.`);
    }
    
    // Set environment variables for testing
    const env = {
      ...process.env,
      NODE_ENV: 'test',
      PORT: '3001',
      MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/task-manager-test'
    };

    console.log('📋 Environment variables:');
    console.log(`  NODE_ENV: ${env.NODE_ENV}`);
    console.log(`  PORT: ${env.PORT}`);
    console.log(`  MONGODB_URI: ${env.MONGODB_URI}`);

    // Verify MongoDB connection before starting server
    console.log('🔍 Verifying MongoDB connection...');
    try {
      const { spawn } = require('child_process');
      const mongoCheck = spawn('mongosh', ['--eval', 'db.adminCommand("ping")'], { 
        env,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      await new Promise((resolve, reject) => {
        mongoCheck.on('close', (code) => {
          if (code === 0) {
            console.log('✅ MongoDB connection verified');
            resolve();
          } else {
            reject(new Error(`MongoDB connection failed with code ${code}`));
          }
        });
        mongoCheck.on('error', (error) => {
          reject(new Error(`MongoDB connection error: ${error.message}`));
        });
      });
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      throw error;
    }

    // Start the server process
    console.log('🔄 Starting server process...');
    this.serverProcess = spawn('node', ['dist/index.js'], {
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
      cwd: path.resolve(__dirname, '..')
    });

    // Handle server output with better debugging
    this.serverProcess.stdout.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.log(`📤 Server stdout: ${output}`);
      }
    });

    this.serverProcess.stderr.on('data', (data) => {
      const output = data.toString().trim();
      if (output) {
        console.error(`📥 Server stderr: ${output}`);
      }
    });

    this.serverProcess.on('error', (error) => {
      console.error(`❌ Server process error: ${error.message}`);
    });

    this.serverProcess.on('exit', (code, signal) => {
      if (code !== 0) {
        console.error(`❌ Server process exited with code ${code}, signal ${signal}`);
      }
    });

    // Wait for server to be ready
    await this.waitForServer();
    console.log('✅ Test server is ready');
  }

  async waitForServer() {
    console.log(`⏳ Waiting for server to be ready at ${this.baseUrl}/health...`);
    
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        const response = await axios.get(`${this.baseUrl}/health`, { timeout: 2000 });
        console.log(`✅ Server health check successful: ${response.status}`);
        return;
      } catch (error) {
        const attempt = i + 1;
        if (attempt % 5 === 0 || attempt === this.maxRetries) {
          console.log(`⏳ Attempt ${attempt}/${this.maxRetries}: ${error.message}`);
          
          // Check if server process is still running
          if (this.serverProcess && this.serverProcess.killed) {
            throw new Error(`Server process died before health check succeeded. Last error: ${error.message}`);
          }
        }
        
        if (i === this.maxRetries - 1) {
          // Final attempt failed - provide detailed error information
          const errorDetails = {
            message: `Server failed to start after ${this.maxRetries} attempts`,
            lastError: error.message,
            serverProcessRunning: this.serverProcess && !this.serverProcess.killed,
            baseUrl: this.baseUrl,
            maxRetries: this.maxRetries,
            retryDelay: this.retryDelay
          };
          
          console.error('❌ Server startup failed. Details:', errorDetails);
          throw new Error(`${errorDetails.message}. Last error: ${error.message}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
  }

  async stop() {
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

  isRunning() {
    return this.serverProcess && !this.serverProcess.killed;
  }
}

// Global test server instance
let testServer = null;

// Setup and teardown functions for Jest (only if running in Jest environment)
if (typeof beforeAll !== 'undefined') {
  beforeAll(async () => {
    testServer = new TestServer();
    await testServer.start();
  }, 60000); // 60 second timeout for server startup

  afterAll(async () => {
    if (testServer) {
      await testServer.stop();
    }
  }, 10000); // 10 second timeout for server shutdown
}

// Export for manual use if needed
module.exports = { TestServer, testServer };
