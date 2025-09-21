import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

export const config = {
  // Database configuration
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/task-manager',
  },
  
  // Server configuration
  server: {
    port: parseInt(process.env.PORT || '3001', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  
  // API configuration
  api: {
    baseUrl: process.env.API_BASE_URL || 'http://localhost:3001/api',
  },
} as const;

// Validate required environment variables
export const validateConfig = (): void => {
  const requiredVars = ['MONGODB_URI'];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Missing required environment variable: ${varName}`);
    }
  }
};

export default config;
