import mongoose, { Document, Schema } from 'mongoose';
import { TaskPriority } from '../types/task';

// MongoDB document interface
export interface ITask extends Document {
  title: string;
  description: string;
  completed: boolean;
  priority: TaskPriority;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

// Task schema definition
const TaskSchema = new Schema<ITask>({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  completed: {
    type: Boolean,
    default: false,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'] as TaskPriority[],
    default: 'medium',
    required: [true, 'Priority is required'],
  },
  dueDate: {
    type: String,
    validate: {
      validator: function(v: string) {
        // Validate ISO date format (YYYY-MM-DD)
        return !v || /^\d{4}-\d{2}-\d{2}$/.test(v);
      },
      message: 'Due date must be in YYYY-MM-DD format',
    },
  },
  createdAt: {
    type: String,
    default: () => new Date().toISOString(),
  },
  updatedAt: {
    type: String,
    default: () => new Date().toISOString(),
  },
}, {
  timestamps: false, // We're handling timestamps manually
});

// Update the updatedAt field before saving
TaskSchema.pre('save', function(next) {
  this.updatedAt = new Date().toISOString();
  next();
});

// Update the updatedAt field before updating (excluding updateMany)
TaskSchema.pre(['updateOne', 'findOneAndUpdate'], function(next) {
  this.set({ updatedAt: new Date().toISOString() });
  next();
});

// Create and export the model
export const TaskModel = mongoose.model<ITask>('Task', TaskSchema);
