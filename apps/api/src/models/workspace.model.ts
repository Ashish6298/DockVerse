import mongoose, { Schema, Document } from 'mongoose';
import type { Workspace as IWorkspace } from '@dockverse/types';

export interface WorkspaceDocument extends Omit<IWorkspace, '_id' | 'createdAt' | 'updatedAt'>, Document {
  createdAt: Date;
  updatedAt: Date;
}

const WorkspaceResourceSchema = new Schema({
  type: {
    type: String,
    enum: ['container', 'image', 'network', 'volume'],
    required: true
  },
  id: {
    type: String,
    required: true
  }
}, { _id: false });

const WorkspaceSchema = new Schema<WorkspaceDocument>({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  resources: {
    type: [WorkspaceResourceSchema],
    default: []
  }
}, {
  timestamps: true
});

export const WorkspaceModel = mongoose.model<WorkspaceDocument>('Workspace', WorkspaceSchema);
export default WorkspaceModel;
