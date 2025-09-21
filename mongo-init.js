// MongoDB initialization script for Docker
// This script runs when the MongoDB container starts for the first time

// Switch to the task-manager database
db = db.getSiblingDB('task-manager');

// Create a user for the application
db.createUser({
  user: 'taskmanager',
  pwd: 'taskmanager123', // In production, use a secure password
  roles: [
    {
      role: 'readWrite',
      db: 'task-manager'
    }
  ]
});

// Create initial collections with validation
db.createCollection('tasks', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['title', 'priority', 'completed', 'createdAt', 'updatedAt'],
      properties: {
        title: {
          bsonType: 'string',
          description: 'Task title is required and must be a string',
          minLength: 1,
          maxLength: 200
        },
        description: {
          bsonType: 'string',
          description: 'Task description must be a string',
          maxLength: 1000
        },
        priority: {
          enum: ['low', 'medium', 'high'],
          description: 'Priority must be one of: low, medium, high'
        },
        completed: {
          bsonType: 'bool',
          description: 'Completed status is required and must be a boolean'
        },
        dueDate: {
          bsonType: 'string',
          description: 'Due date must be a string in ISO format'
        },
        createdAt: {
          bsonType: 'string',
          description: 'Created date is required and must be a string'
        },
        updatedAt: {
          bsonType: 'string',
          description: 'Updated date is required and must be a string'
        }
      }
    }
  }
});

// Create indexes for better performance
db.tasks.createIndex({ title: 'text', description: 'text' });
db.tasks.createIndex({ priority: 1 });
db.tasks.createIndex({ completed: 1 });
db.tasks.createIndex({ dueDate: 1 });
db.tasks.createIndex({ createdAt: -1 });

// Insert some sample data
db.tasks.insertMany([
  {
    title: 'Welcome to Task Manager',
    description: 'This is your first task! You can edit or delete it.',
    priority: 'medium',
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    title: 'Set up your project',
    description: 'Configure your development environment and start building amazing things.',
    priority: 'high',
    completed: false,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]);

print('✅ MongoDB initialization completed successfully!');
print('📊 Database: task-manager');
print('👤 User: taskmanager');
print('📝 Sample tasks created');
