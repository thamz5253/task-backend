// Use global axios instance from setup.js
const axios = global.axios || require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3001/api';
const TEST_TIMEOUT = 10000;

// Helper function to create a test task
async function createTestTask(taskData = {}) {
  const defaultTask = {
    title: 'Test Task',
    description: 'This is a test task',
    priority: 'medium',
    ...taskData
  };
  
  try {
    const response = await axios.post(`${BASE_URL}/tasks`, defaultTask);
    return response.data;
  } catch (error) {
    handleConnectionError(error, 'createTestTask');
    console.error('Error creating test task:', error.response?.data || error.message);
    throw error;
  }
}

// Helper function to clean up test tasks
async function cleanupTestTasks() {
  try {
    // Get all tasks and delete them
    const response = await axios.get(`${BASE_URL}/tasks`);
    const tasks = response.data;
    
    for (const task of tasks) {
      try {
        await axios.delete(`${BASE_URL}/tasks/${task._id}`);
      } catch (error) {
        // Ignore errors for cleanup
      }
    }
  } catch (error) {
    // Ignore cleanup errors
  }
}

// Helper function to handle connection errors
function handleConnectionError(error, testName) {
  if (error.code === 'ECONNREFUSED') {
    fail(`Server is not running for test: ${testName}. Make sure the test server is started.`);
  }
  throw error;
}

// Helper function to handle error responses
function expectErrorResponse(error, expectedStatus, expectedError) {
  if (error.code === 'ECONNREFUSED') {
    fail('Server is not running. Make sure the test server is started.');
  }
  if (!error.response) {
    fail(`Expected error response but got: ${error.message}`);
  }
  expect(error.response.status).toBe(expectedStatus);
  if (expectedError) {
    expect(error.response.data.error).toBe(expectedError);
  }
}

// Test suite for task operations
describe('Task Operations Tests', () => {
  let testTaskId;
  
  beforeAll(async () => {
    // Clean up any existing test data
    await cleanupTestTasks();
  }, TEST_TIMEOUT);
  
  afterAll(async () => {
    // Clean up test data
    await cleanupTestTasks();
  }, TEST_TIMEOUT);

  describe('Task Creation', () => {
    test('should create a new task successfully', async () => {
      const taskData = {
        title: 'Create Test Task',
        description: 'Testing task creation',
        priority: 'high'
      };
      
      const response = await axios.post(`${BASE_URL}/tasks`, taskData);
      
      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('_id');
      expect(response.data.title).toBe(taskData.title);
      expect(response.data.description).toBe(taskData.description);
      expect(response.data.priority).toBe(taskData.priority);
      expect(response.data.completed).toBe(false);
      expect(response.data).toHaveProperty('createdAt');
      expect(response.data).toHaveProperty('updatedAt');
      
      testTaskId = response.data._id;
    }, TEST_TIMEOUT);

    test('should fail to create task without required fields', async () => {
      const invalidTaskData = {
        description: 'Missing title and priority'
      };
      
      try {
        await axios.post(`${BASE_URL}/tasks`, invalidTaskData);
        fail('Should have thrown an error');
      } catch (error) {
        expectErrorResponse(error, 400, 'Bad Request');
        expect(error.response.data.message).toContain('required');
      }
    }, TEST_TIMEOUT);
  });

  describe('Task Completion', () => {
    test('should toggle task completion status', async () => {
      if (!testTaskId) {
        const task = await createTestTask({ title: 'Toggle Test Task' });
        testTaskId = task._id;
      }
      
      // Toggle to completed
      const toggleResponse = await axios.patch(`${BASE_URL}/tasks/${testTaskId}/toggle`, {
        completed: true
      });
      
      expect(toggleResponse.status).toBe(200);
      expect(toggleResponse.data.completed).toBe(true);
      expect(toggleResponse.data._id).toBe(testTaskId);
      
      // Toggle back to incomplete
      const toggleBackResponse = await axios.patch(`${BASE_URL}/tasks/${testTaskId}/toggle`, {
        completed: false
      });
      
      expect(toggleBackResponse.status).toBe(200);
      expect(toggleBackResponse.data.completed).toBe(false);
    }, TEST_TIMEOUT);

    test('should handle invalid task ID for toggle', async () => {
      const invalidId = '507f1f77bcf86cd799439011'; // Valid ObjectId format but non-existent
      
      try {
        await axios.patch(`${BASE_URL}/tasks/${invalidId}/toggle`, {
          completed: true
        });
        fail('Should have thrown an error');
      } catch (error) {
        expectErrorResponse(error, 404, 'Not Found');
      }
    }, TEST_TIMEOUT);

    test('should handle malformed task ID for toggle', async () => {
      const malformedId = 'invalid-id';
      
      try {
        await axios.patch(`${BASE_URL}/tasks/${malformedId}/toggle`, {
          completed: true
        });
        fail('Should have thrown an error');
      } catch (error) {
        expectErrorResponse(error, 500, 'Internal Server Error');
      }
    }, TEST_TIMEOUT);
  });

  describe('Task Editing', () => {
    test('should update task successfully', async () => {
      if (!testTaskId) {
        const task = await createTestTask({ title: 'Edit Test Task' });
        testTaskId = task._id;
      }
      
      const updateData = {
        title: 'Updated Task Title',
        description: 'Updated task description',
        priority: 'high',
        dueDate: '2024-12-31'
      };
      
      const response = await axios.put(`${BASE_URL}/tasks/${testTaskId}`, updateData);
      
      expect(response.status).toBe(200);
      expect(response.data.title).toBe(updateData.title);
      expect(response.data.description).toBe(updateData.description);
      expect(response.data.priority).toBe(updateData.priority);
      expect(response.data.dueDate).toBe(updateData.dueDate);
      expect(response.data._id).toBe(testTaskId);
      expect(new Date(response.data.updatedAt)).toBeInstanceOf(Date);
    }, TEST_TIMEOUT);

    test('should update only specified fields', async () => {
      if (!testTaskId) {
        const task = await createTestTask({ title: 'Partial Edit Test Task' });
        testTaskId = task._id;
      }
      
      const originalTask = await axios.get(`${BASE_URL}/tasks/${testTaskId}`);
      const originalData = originalTask.data;
      
      const updateData = {
        title: 'Only Title Updated'
      };
      
      const response = await axios.put(`${BASE_URL}/tasks/${testTaskId}`, updateData);
      
      expect(response.status).toBe(200);
      expect(response.data.title).toBe(updateData.title);
      expect(response.data.description).toBe(originalData.description);
      expect(response.data.priority).toBe(originalData.priority);
      expect(response.data.completed).toBe(originalData.completed);
    }, TEST_TIMEOUT);

    test('should handle invalid task ID for update', async () => {
      const invalidId = '507f1f77bcf86cd799439011';
      
      try {
        await axios.put(`${BASE_URL}/tasks/${invalidId}`, {
          title: 'Updated Title'
        });
        fail('Should have thrown an error');
      } catch (error) {
        expectErrorResponse(error, 404, 'Not Found');
      }
    }, TEST_TIMEOUT);

    test('should validate due date format', async () => {
      if (!testTaskId) {
        const task = await createTestTask({ title: 'Date Validation Test Task' });
        testTaskId = task._id;
      }
      
      try {
        await axios.put(`${BASE_URL}/tasks/${testTaskId}`, {
          dueDate: 'invalid-date-format'
        });
        fail('Should have thrown an error');
      } catch (error) {
        expectErrorResponse(error, 500, 'Internal Server Error');
      }
    }, TEST_TIMEOUT);
  });

  describe('Task Deletion', () => {
    test('should delete task successfully', async () => {
      // Create a new task specifically for deletion test
      const taskToDelete = await createTestTask({ title: 'Task to Delete' });
      const taskId = taskToDelete._id;
      
      const response = await axios.delete(`${BASE_URL}/tasks/${taskId}`);
      
      expect(response.status).toBe(204);
      
      // Verify task is deleted
      try {
        await axios.get(`${BASE_URL}/tasks/${taskId}`);
        fail('Task should have been deleted');
      } catch (error) {
        expectErrorResponse(error, 404);
      }
    }, TEST_TIMEOUT);

    test('should handle invalid task ID for deletion', async () => {
      const invalidId = '507f1f77bcf86cd799439011';
      
      try {
        await axios.delete(`${BASE_URL}/tasks/${invalidId}`);
        fail('Should have thrown an error');
      } catch (error) {
        expectErrorResponse(error, 404, 'Not Found');
      }
    }, TEST_TIMEOUT);

    test('should handle malformed task ID for deletion', async () => {
      const malformedId = 'invalid-id';
      
      try {
        await axios.delete(`${BASE_URL}/tasks/${malformedId}`);
        fail('Should have thrown an error');
      } catch (error) {
        expectErrorResponse(error, 500, 'Internal Server Error');
      }
    }, TEST_TIMEOUT);
  });

  describe('Bulk Operations', () => {
    test('should mark all tasks as completed', async () => {
      // Create multiple tasks
      const task1 = await createTestTask({ title: 'Bulk Task 1', completed: false });
      const task2 = await createTestTask({ title: 'Bulk Task 2', completed: false });
      
      const response = await axios.patch(`${BASE_URL}/tasks/mark-all-completed`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      
      // Verify all tasks are completed
      const allTasks = await axios.get(`${BASE_URL}/tasks`);
      const completedTasks = allTasks.data.filter(task => task.completed);
      expect(completedTasks.length).toBeGreaterThan(0);
    }, TEST_TIMEOUT);

    test('should delete all completed tasks', async () => {
      // Create some completed tasks
      const task1 = await createTestTask({ title: 'Completed Task 1' });
      const task2 = await createTestTask({ title: 'Completed Task 2' });
      
      // Mark them as completed
      await axios.patch(`${BASE_URL}/tasks/${task1._id}/toggle`, { completed: true });
      await axios.patch(`${BASE_URL}/tasks/${task2._id}/toggle`, { completed: true });
      
      const response = await axios.delete(`${BASE_URL}/tasks/completed`);
      
      expect(response.status).toBe(204);
      
      // Verify completed tasks are deleted
      const remainingTasks = await axios.get(`${BASE_URL}/tasks`);
      const completedTasks = remainingTasks.data.filter(task => task.completed);
      expect(completedTasks.length).toBe(0);
    }, TEST_TIMEOUT);
  });

  describe('Task Retrieval', () => {
    test('should get all tasks', async () => {
      // Create a few test tasks
      await createTestTask({ title: 'Retrieval Test Task 1' });
      await createTestTask({ title: 'Retrieval Test Task 2' });
      
      const response = await axios.get(`${BASE_URL}/tasks`);
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThan(0);
    }, TEST_TIMEOUT);

    test('should get single task by ID', async () => {
      const task = await createTestTask({ title: 'Single Task Retrieval Test' });
      
      const response = await axios.get(`${BASE_URL}/tasks/${task._id}`);
      
      expect(response.status).toBe(200);
      expect(response.data._id).toBe(task._id);
      expect(response.data.title).toBe(task.title);
    }, TEST_TIMEOUT);

    test('should filter tasks by completion status', async () => {
      // Create tasks with different completion statuses
      const completedTask = await createTestTask({ title: 'Completed Filter Test' });
      const pendingTask = await createTestTask({ title: 'Pending Filter Test' });
      
      // Mark one as completed
      await axios.patch(`${BASE_URL}/tasks/${completedTask._id}/toggle`, { completed: true });
      
      // Test completed filter
      const completedResponse = await axios.get(`${BASE_URL}/tasks?completed=true`);
      expect(completedResponse.status).toBe(200);
      expect(completedResponse.data.every(task => task.completed)).toBe(true);
      
      // Test pending filter
      const pendingResponse = await axios.get(`${BASE_URL}/tasks?completed=false`);
      expect(pendingResponse.status).toBe(200);
      expect(pendingResponse.data.every(task => !task.completed)).toBe(true);
    }, TEST_TIMEOUT);

    test('should filter tasks by priority', async () => {
      const highPriorityTask = await createTestTask({ title: 'High Priority Task', priority: 'high' });
      const lowPriorityTask = await createTestTask({ title: 'Low Priority Task', priority: 'low' });
      
      const response = await axios.get(`${BASE_URL}/tasks?priority=high`);
      
      expect(response.status).toBe(200);
      expect(response.data.every(task => task.priority === 'high')).toBe(true);
    }, TEST_TIMEOUT);

    test('should search tasks by title and description', async () => {
      const searchTask = await createTestTask({ 
        title: 'Unique Search Test Task', 
        description: 'This is a unique description for search testing' 
      });
      
      const response = await axios.get(`${BASE_URL}/tasks?search=Unique`);
      
      expect(response.status).toBe(200);
      expect(response.data.some(task => task.title.includes('Unique'))).toBe(true);
    }, TEST_TIMEOUT);
  });
});

// Export for potential use in other test files
module.exports = {
  createTestTask,
  cleanupTestTasks,
  BASE_URL
};
