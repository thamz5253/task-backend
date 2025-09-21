# Testing Guide

This document explains how to run tests for the Task Manager Backend API.

## Prerequisites

- Node.js 18+
- MongoDB (running locally or accessible via connection string)
- All dependencies installed (`npm install`)

## Test Setup

The test suite includes:
- **Integration tests** that test the full API endpoints
- **Server setup** that automatically starts and stops the server
- **Database cleanup** between test runs
- **Connection error handling** for better debugging

## Running Tests

### Local Development

1. **Build the application first:**
   ```bash
   npm run build
   ```

2. **Run tests with automatic server management:**
   ```bash
   npm run test:with-server
   ```

3. **Run tests with coverage:**
   ```bash
   npm run test:coverage
   ```

4. **Run tests in watch mode (for development):**
   ```bash
   npm run test:watch
   ```

### CI/CD Pipeline

The GitHub Actions workflow automatically:
- Sets up MongoDB service
- Builds the application
- Runs tests with server management
- Generates coverage reports

## Test Configuration

### Environment Variables

Tests use the following environment variables:
- `NODE_ENV=test`
- `PORT=3001`
- `MONGODB_URI=mongodb://localhost:27017/task-manager-test`
- `DEBUG=true` (optional, for verbose logging)

### Test Files

- `test/task-operations.test.js` - Main test suite for API endpoints
- `test/setup.js` - Jest setup and global utilities
- `test/server-setup.js` - Server lifecycle management
- `scripts/test-with-server.js` - Standalone test runner

## Test Structure

### Test Categories

1. **Task Creation**
   - Valid task creation
   - Validation error handling

2. **Task Completion**
   - Toggle completion status
   - Error handling for invalid IDs

3. **Task Editing**
   - Update task fields
   - Partial updates
   - Date validation

4. **Task Deletion**
   - Delete single tasks
   - Error handling

5. **Bulk Operations**
   - Mark all tasks as completed
   - Delete all completed tasks

6. **Task Retrieval**
   - Get all tasks
   - Filter by completion status
   - Filter by priority
   - Search functionality

### Helper Functions

- `createTestTask()` - Creates a test task with default or custom data
- `cleanupTestTasks()` - Removes all test data
- `handleConnectionError()` - Provides better error messages for connection issues

## Troubleshooting

### Common Issues

1. **Connection Refused Errors**
   - Make sure MongoDB is running
   - Check if port 3001 is available
   - Verify the server starts successfully

2. **Test Timeouts**
   - Increase timeout in `jest.config.js`
   - Check server startup time
   - Verify database connectivity

3. **Database Issues**
   - Ensure MongoDB is accessible
   - Check connection string format
   - Verify database permissions

### Debug Mode

Run tests with debug output:
```bash
DEBUG=true npm run test:with-server
```

This will show:
- Server startup logs
- Database connection status
- Detailed error messages

## Test Data

Tests use a separate database (`task-manager-test`) to avoid conflicts with development data. All test data is automatically cleaned up after each test run.

## Coverage

Test coverage includes:
- All API endpoints
- Error handling paths
- Validation logic
- Database operations

Coverage reports are generated in the `coverage/` directory and can be viewed in HTML format.
