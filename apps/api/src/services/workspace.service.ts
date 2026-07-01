import WorkspaceModel, { WorkspaceDocument } from '../models/workspace.model.js';
import { CreateWorkspaceInput, UpdateWorkspaceInput } from '../validators/workspace.validator.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';
import logger from '../utils/logger.js';

class WorkspaceService {
  public async listWorkspaces(): Promise<WorkspaceDocument[]> {
    logger.debug('Listing all workspaces');
    return await WorkspaceModel.find().sort({ createdAt: -1 });
  }

  public async getWorkspaceById(id: string): Promise<WorkspaceDocument> {
    logger.debug({ id }, 'Fetching workspace by ID');
    const workspace = await WorkspaceModel.findById(id);
    if (!workspace) {
      throw new NotFoundError(`Workspace with ID ${id} not found`);
    }
    return workspace;
  }

  public async createWorkspace(input: CreateWorkspaceInput): Promise<WorkspaceDocument> {
    logger.info({ name: input.name }, 'Creating new workspace');
    
    // Check if name already exists
    const existing = await WorkspaceModel.findOne({ name: input.name });
    if (existing) {
      throw new ValidationError(`Workspace name "${input.name}" is already in use`);
    }

    try {
      const workspace = new WorkspaceModel(input);
      return await workspace.save();
    } catch (error: any) {
      logger.error({ err: error }, 'Failed to create workspace');
      if (error.code === 11000) {
        throw new ValidationError(`Workspace name "${input.name}" is already in use`);
      }
      throw error;
    }
  }

  public async updateWorkspace(id: string, input: UpdateWorkspaceInput): Promise<WorkspaceDocument> {
    logger.info({ id }, 'Updating workspace');
    
    const workspace = await WorkspaceModel.findById(id);
    if (!workspace) {
      throw new NotFoundError(`Workspace with ID ${id} not found`);
    }

    if (input.name && input.name !== workspace.name) {
      const existing = await WorkspaceModel.findOne({ name: input.name });
      if (existing) {
        throw new ValidationError(`Workspace name "${input.name}" is already in use`);
      }
    }

    try {
      Object.assign(workspace, input);
      return await workspace.save();
    } catch (error: any) {
      logger.error({ err: error }, 'Failed to update workspace');
      if (error.code === 11000) {
        throw new ValidationError(`Workspace name "${input.name}" is already in use`);
      }
      throw error;
    }
  }

  public async deleteWorkspace(id: string): Promise<WorkspaceDocument> {
    logger.info({ id }, 'Deleting workspace');
    const workspace = await WorkspaceModel.findByIdAndDelete(id);
    if (!workspace) {
      throw new NotFoundError(`Workspace with ID ${id} not found`);
    }
    return workspace;
  }
}

export const workspaceService = new WorkspaceService();
export default workspaceService;
