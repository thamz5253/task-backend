import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TaskModel } from '../models/Task';
import { 
  CreateTaskRequest, 
  UpdateTaskRequest, 
  ToggleTaskRequest, 
  TaskQueryParams,
  Task,
  ErrorResponse 
} from '../types/task';

// Request interfaces for route parameters
interface TaskParams {
  id: string;
}

// Get all tasks with optional filtering
export async function getTasks(
  request: FastifyRequest<{ Querystring: TaskQueryParams }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { completed, priority, search } = request.query;
    
    // Build filter object
    const filter: any = {};
    
    if (completed !== undefined) {
      filter.completed = completed;
    }
    
    if (priority) {
      filter.priority = priority;
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const tasks = await TaskModel.find(filter).sort({ createdAt: -1 });
    reply.send(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    const errorResponse: ErrorResponse = {
      error: 'Internal Server Error',
      message: 'Failed to fetch tasks',
      statusCode: 500
    };
    reply.status(500).send(errorResponse);
  }
}

// Get single task by ID
export async function getTask(
  request: FastifyRequest<{ Params: TaskParams }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { id } = request.params;
    
    const task = await TaskModel.findById(id);
    
    if (!task) {
      const errorResponse: ErrorResponse = {
        error: 'Not Found',
        message: 'Task not found',
        statusCode: 404
      };
      reply.status(404).send(errorResponse);
      return;
    }
    
    reply.send(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    const errorResponse: ErrorResponse = {
      error: 'Internal Server Error',
      message: 'Failed to fetch task',
      statusCode: 500
    };
    reply.status(500).send(errorResponse);
  }
}

// Create new task
export async function createTask(
  request: FastifyRequest<{ Body: CreateTaskRequest }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const taskData = request.body;
    
    // Validate required fields
    if (!taskData.title || !taskData.priority) {
      const errorResponse: ErrorResponse = {
        error: 'Bad Request',
        message: 'Title and priority are required',
        statusCode: 400
      };
      reply.status(400).send(errorResponse);
      return;
    }
    
    const newTask = new TaskModel({
      ...taskData,
      description: taskData.description || '',
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    const savedTask = await newTask.save();
    reply.status(201).send(savedTask);
  } catch (error) {
    console.error('Error creating task:', error);
    const errorResponse: ErrorResponse = {
      error: 'Internal Server Error',
      message: 'Failed to create task',
      statusCode: 500
    };
    reply.status(500).send(errorResponse);
  }
}

// Update task
export async function updateTask(
  request: FastifyRequest<{ Params: TaskParams; Body: UpdateTaskRequest }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { id } = request.params;
    const updateData = request.body;
    
    const updatedTask = await TaskModel.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date().toISOString() },
      { new: true, runValidators: true }
    );
    
    if (!updatedTask) {
      const errorResponse: ErrorResponse = {
        error: 'Not Found',
        message: 'Task not found',
        statusCode: 404
      };
      reply.status(404).send(errorResponse);
      return;
    }
    
    reply.send(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    const errorResponse: ErrorResponse = {
      error: 'Internal Server Error',
      message: 'Failed to update task',
      statusCode: 500
    };
    reply.status(500).send(errorResponse);
  }
}

// Delete task
export async function deleteTask(
  request: FastifyRequest<{ Params: TaskParams }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { id } = request.params;
    
    const deletedTask = await TaskModel.findByIdAndDelete(id);
    
    if (!deletedTask) {
      const errorResponse: ErrorResponse = {
        error: 'Not Found',
        message: 'Task not found',
        statusCode: 404
      };
      reply.status(404).send(errorResponse);
      return;
    }
    
    reply.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    const errorResponse: ErrorResponse = {
      error: 'Internal Server Error',
      message: 'Failed to delete task',
      statusCode: 500
    };
    reply.status(500).send(errorResponse);
  }
}

// Toggle task completion
export async function toggleTask(
  request: FastifyRequest<{ Params: TaskParams; Body: ToggleTaskRequest }>,
  reply: FastifyReply
): Promise<void> {
  try {
    const { id } = request.params;
    const { completed } = request.body;
    
    const updatedTask = await TaskModel.findByIdAndUpdate(
      id,
      { completed, updatedAt: new Date().toISOString() },
      { new: true, runValidators: true }
    );
    
    if (!updatedTask) {
      const errorResponse: ErrorResponse = {
        error: 'Not Found',
        message: 'Task not found',
        statusCode: 404
      };
      reply.status(404).send(errorResponse);
      return;
    }
    
    reply.send(updatedTask);
  } catch (error) {
    console.error('Error toggling task:', error);
    const errorResponse: ErrorResponse = {
      error: 'Internal Server Error',
      message: 'Failed to toggle task',
      statusCode: 500
    };
    reply.status(500).send(errorResponse);
  }
}

// Delete all completed tasks
export async function deleteCompletedTasks(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const result = await TaskModel.deleteMany({ completed: true });
    reply.status(204).send();
  } catch (error) {
    console.error('Error deleting completed tasks:', error);
    const errorResponse: ErrorResponse = {
      error: 'Internal Server Error',
      message: 'Failed to delete completed tasks',
      statusCode: 500
    };
    reply.status(500).send(errorResponse);
  }
}

// Mark all tasks as completed
export async function markAllTasksCompleted(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const result = await TaskModel.updateMany(
      { completed: false },
      { completed: true, updatedAt: new Date().toISOString() }
    );
    
    // Return the updated tasks
    const updatedTasks = await TaskModel.find().sort({ createdAt: -1 });
    reply.send(updatedTasks);
  } catch (error) {
    console.error('Error marking all tasks as completed:', error);
    const errorResponse: ErrorResponse = {
      error: 'Internal Server Error',
      message: 'Failed to mark all tasks as completed',
      statusCode: 500
    };
    reply.status(500).send(errorResponse);
  }
}

// Register task routes
export async function taskRoutes(fastify: FastifyInstance): Promise<void> {
  // Get all tasks
  fastify.get('/tasks', getTasks);
  
  // Get single task
  fastify.get('/tasks/:id', getTask);
  
  // Create task
  fastify.post('/tasks', createTask);
  
  // Update task
  fastify.put('/tasks/:id', updateTask);
  
  // Delete task
  fastify.delete('/tasks/:id', deleteTask);
  
  // Toggle task completion
  fastify.patch('/tasks/:id/toggle', toggleTask);
  
  // Delete all completed tasks
  fastify.delete('/tasks/completed', deleteCompletedTasks);
  
  // Mark all tasks as completed
  fastify.patch('/tasks/mark-all-completed', markAllTasksCompleted);
}
