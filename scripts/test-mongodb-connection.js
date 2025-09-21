#!/usr/bin/env node

const { spawn } = require('child_process');

async function testMongoDBConnection() {
  console.log('🔍 Testing MongoDB connection...');
  
  // Try mongosh first, then fallback to mongo
  let mongoCommand = 'mongosh';
  let mongoArgs = ['--eval', 'db.adminCommand("ping")'];
  
  try {
    const { execSync } = require('child_process');
    execSync('which mongosh', { stdio: 'ignore' });
    console.log('📝 Using mongosh...');
  } catch (error) {
    console.log('📝 mongosh not found, trying mongo...');
    mongoCommand = 'mongo';
    mongoArgs = ['--eval', 'db.adminCommand("ping")'];
  }
  
  return new Promise((resolve, reject) => {
    const mongoProcess = spawn(mongoCommand, mongoArgs, {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    mongoProcess.stdout.on('data', (data) => {
      output += data.toString();
    });

    mongoProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    mongoProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ MongoDB connection successful!');
        console.log('Output:', output.trim());
        resolve();
      } else {
        console.error('❌ MongoDB connection failed!');
        console.error('Exit code:', code);
        console.error('Error output:', errorOutput);
        reject(new Error(`MongoDB connection failed with exit code ${code}`));
      }
    });

    mongoProcess.on('error', (error) => {
      console.error('❌ Error starting MongoDB process:', error.message);
      reject(error);
    });
  });
}

// Run the test
if (require.main === module) {
  testMongoDBConnection()
    .then(() => {
      console.log('🎉 MongoDB connection test passed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 MongoDB connection test failed:', error.message);
      process.exit(1);
    });
}

module.exports = testMongoDBConnection;
