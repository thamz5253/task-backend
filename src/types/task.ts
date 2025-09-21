// Task priority levels
export type TaskPriority = 'low' | 'medium' | 'high';

// Main Task interface
export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: TaskPriority;
  dueDate?: string; // ISO date string (YYYY-MM-DD)
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// Request interfaces for API endpoints
export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority: TaskPriority;
  dueDate?: string; // ISO date string (YYYY-MM-DD)
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  completed?: boolean;
  priority?: TaskPriority;
  dueDate?: string; // ISO date string (YYYY-MM-DD)
}

// Query parameters for filtering tasks
export interface TaskQueryParams {
  completed?: boolean;
  priority?: TaskPriority;
  search?: string;
}

// Toggle completion request
export interface ToggleTaskRequest {
  completed: boolean;
}

// Error response interface
export interface ErrorResponse {
  error: string;
  message?: string;
  statusCode: number;
}
