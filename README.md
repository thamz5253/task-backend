# Task Manager Backend API

A Node.js backend API built with TypeScript, Fastify, and MongoDB for the Task Manager application.

## Features

- ✅ TypeScript for type safety
- ✅ Fastify for high-performance HTTP server
- ✅ MongoDB with Mongoose for data persistence
- ✅ Environment-based configuration
- ✅ CORS support
- ✅ Comprehensive error handling
- ✅ Graceful shutdown handling
- ✅ Health check endpoint

## API Endpoints

All endpoints are prefixed with `/api`:

### Tasks
- `GET /api/tasks` - Get all tasks (with optional filtering)
- `GET /api/tasks/:id` - Get single task
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PATCH /api/tasks/:id/toggle` - Toggle task completion
- `DELETE /api/tasks/completed` - Delete all completed tasks
- `PATCH /api/tasks/mark-all-completed` - Mark all tasks as completed

### Health Check
- `GET /health` - Server health status

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Installation

1. **Clone and navigate to the project:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your MongoDB connection string:
   ```env
   MONGODB_URI=mongodb://localhost:27017/task-manager
   PORT=3001
   NODE_ENV=development
   API_BASE_URL=http://localhost:3001/api
   ```

4. **Start MongoDB:**
   - Local: Make sure MongoDB is running on your system
   - Cloud: Use MongoDB Atlas or another cloud provider

## Development

### Start development server:
```bash
npm run dev
```

The server will start on `http://localhost:3001` with hot reload enabled.

### Build for production:
```bash
npm run build
```

### Start production server:
```bash
npm start
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/task-manager` |
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment (development/production) | `development` |
| `API_BASE_URL` | API base URL | `http://localhost:3001/api` |

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

### Create Task Request
```typescript
interface CreateTaskRequest {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string; // ISO date string (YYYY-MM-DD)
}
```

### Update Task Request
```typescript
interface UpdateTaskRequest {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string; // ISO date string (YYYY-MM-DD)
}
```

## API Usage Examples

### Get all tasks
```bash
curl http://localhost:3001/api/tasks
```

### Get tasks with filters
```bash
curl "http://localhost:3001/api/tasks?completed=false&priority=high&search=important"
```

### Create a task
```bash
curl -X POST http://localhost:3001/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete project",
    "description": "Finish the task manager project",
    "priority": "high",
    "dueDate": "2024-01-15"
  }'
```

### Update a task
```bash
curl -X PUT http://localhost:3001/api/tasks/TASK_ID \
  -H "Content-Type: application/json" \
  -d '{
    "completed": true,
    "priority": "medium"
  }'
```

### Toggle task completion
```bash
curl -X PATCH http://localhost:3001/api/tasks/TASK_ID/toggle \
  -H "Content-Type: application/json" \
  -d '{"completed": true}'
```

## Project Structure

```
src/
├── config.ts              # Environment configuration
├── index.ts               # Main server file
├── database/
│   └── connection.ts      # MongoDB connection management
├── models/
│   └── Task.ts           # Task Mongoose model
├── routes/
│   └── tasks.ts          # Task API routes
└── types/
    └── task.ts           # TypeScript interfaces
```

## Error Handling

The API returns consistent error responses:

```typescript
interface ErrorResponse {
  error: string;
  message?: string;
  statusCode: number;
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `404` - Not Found
- `500` - Internal Server Error

## Health Check

The `/health` endpoint provides server status:

```bash
curl http://localhost:3001/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "database": "connected",
  "environment": "development"
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License
