# Backend Integration Guide

This document explains how to integrate the Task Manager app with a real backend API.

## Quick Start

1. **For Development**: The app currently uses mock data. No backend setup required.

2. **For Production**: Follow the steps below to connect to a real backend.

## Backend Requirements

Your backend should implement a REST API with the following endpoints:

### Base URL
```
http://your-backend-url/api
```

### Endpoints

#### 1. Get All Tasks
```
GET /tasks
Query Parameters:
- completed: boolean (optional) - Filter by completion status
- priority: string (optional) - Filter by priority (low, medium, high)
- search: string (optional) - Search in title and description

Response: Task[]
```

#### 2. Get Single Task
```
GET /tasks/:id
Response: Task
```

#### 3. Create Task
```
POST /tasks
Body: CreateTaskRequest
Response: Task
```

#### 4. Update Task
```
PUT /tasks/:id
Body: UpdateTaskRequest
Response: Task
```

#### 5. Delete Task
```
DELETE /tasks/:id
Response: 204 No Content
```

#### 6. Toggle Task Completion
```
PATCH /tasks/:id/toggle
Body: { completed: boolean }
Response: Task
```

#### 7. Delete All Completed Tasks
```
DELETE /tasks/completed
Response: 204 No Content
```

#### 8. Mark All Tasks as Completed
```
PATCH /tasks/mark-all-completed
Response: Task[]
```

## Data Models

### Task
```typescript
interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string; // ISO date string (YYYY-MM-DD)
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}
```

### CreateTaskRequest
```typescript
interface CreateTaskRequest {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string; // ISO date string (YYYY-MM-DD)
}
```

### UpdateTaskRequest
```typescript
interface UpdateTaskRequest {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string; // ISO date string (YYYY-MM-DD)
}
```

## Integration Steps

### Step 1: Update Service Configuration

Edit `src/services/index.ts`:

```typescript
// Change from mock service to real service
export { default as TaskService } from './taskService';
```

### Step 2: Configure API URL

Edit `src/services/taskService.ts` and update the base URL:

```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://your-backend-url/api';
```

### Step 3: Set Environment Variables

Create a `.env` file in the project root:

```env
REACT_APP_API_URL=http://your-backend-url/api
```

### Step 4: Handle Authentication (Optional)

If your backend requires authentication, update the request interceptor in `taskService.ts`:

```typescript
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
```

## Error Handling

The app handles common HTTP errors:

- **401 Unauthorized**: Redirects to login page
- **404 Not Found**: Shows error message
- **500 Server Error**: Shows generic error message

## Testing Your Integration

1. Start your backend server
2. Update the service configuration
3. Run the React app: `npm start`
4. Test all CRUD operations
5. Check browser network tab for API calls

## Example Backend Implementation

Here's a simple Express.js backend example:

```javascript
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

let tasks = []; // In-memory storage for demo

// Get all tasks
app.get('/api/tasks', (req, res) => {
  let filteredTasks = [...tasks];
  
  if (req.query.completed !== undefined) {
    const completed = req.query.completed === 'true';
    filteredTasks = filteredTasks.filter(task => task.completed === completed);
  }
  
  if (req.query.priority) {
    filteredTasks = filteredTasks.filter(task => task.priority === req.query.priority);
  }
  
  if (req.query.search) {
    const search = req.query.search.toLowerCase();
    filteredTasks = filteredTasks.filter(task => 
      task.title.toLowerCase().includes(search) ||
      task.description.toLowerCase().includes(search)
    );
  }
  
  res.json(filteredTasks);
});

// Create task
app.post('/api/tasks', (req, res) => {
  const newTask = {
    id: Date.now().toString(),
    ...req.body,
    completed: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  tasks.push(newTask);
  res.status(201).json(newTask);
});

// Update task
app.put('/api/tasks/:id', (req, res) => {
  const taskIndex = tasks.findIndex(task => task.id === req.params.id);
  
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  tasks[taskIndex] = {
    ...tasks[taskIndex],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  
  res.json(tasks[taskIndex]);
});

// Delete task
app.delete('/api/tasks/:id', (req, res) => {
  const taskIndex = tasks.findIndex(task => task.id === req.params.id);
  
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  tasks.splice(taskIndex, 1);
  res.status(204).send();
});

// Toggle task completion
app.patch('/api/tasks/:id/toggle', (req, res) => {
  const taskIndex = tasks.findIndex(task => task.id === req.params.id);
  
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  tasks[taskIndex] = {
    ...tasks[taskIndex],
    completed: req.body.completed,
    updatedAt: new Date().toISOString(),
  };
  
  res.json(tasks[taskIndex]);
});

// Delete completed tasks
app.delete('/api/tasks/completed', (req, res) => {
  tasks = tasks.filter(task => !task.completed);
  res.status(204).send();
});

// Mark all tasks as completed
app.patch('/api/tasks/mark-all-completed', (req, res) => {
  const now = new Date().toISOString();
  tasks = tasks.map(task => ({
    ...task,
    completed: true,
    updatedAt: now,
  }));
  
  res.json(tasks);
});

app.listen(3001, () => {
  console.log('Backend server running on http://localhost:3001');
});
```

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure your backend allows CORS requests from your frontend domain
2. **404 Errors**: Verify your API endpoints match the expected URLs
3. **Authentication Issues**: Check that auth tokens are being sent correctly
4. **Data Format Issues**: Ensure your backend returns data in the expected format

### Debug Tips

1. Check browser network tab for failed requests
2. Verify API responses match the expected data structure
3. Test API endpoints directly with tools like Postman
4. Check browser console for JavaScript errors
