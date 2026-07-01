import { Request, Response, NextFunction } from 'express';
import { dockerfileService } from '../services/dockerfile.service.js';
import { validateDockerfileSchema, analyzeDockerfileSchema, buildDockerfileSchema } from '../validators/dockerfile.validator.js';
import { ApiResponse } from '@dockverse/types';
import { ValidationError } from '../utils/errors.js';

function createSuccessResponse<T>(data: T, message: string): ApiResponse<T> {
  return {
    success: true,
    timestamp: new Date().toISOString(),
    message,
    data,
  };
}

export function getTemplates(req: Request, res: Response, next: NextFunction): void {
  try {
    const templates = dockerfileService.getTemplates();
    res.json(createSuccessResponse(templates, 'Dockerfile templates retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export function validateDockerfile(req: Request, res: Response, next: NextFunction): void {
  try {
    const parseResult = validateDockerfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const result = dockerfileService.validateDockerfile(parseResult.data.content);
    res.json(createSuccessResponse(result, 'Dockerfile validated successfully'));
  } catch (error) {
    next(error);
  }
}

export function analyzeDockerfile(req: Request, res: Response, next: NextFunction): void {
  try {
    const parseResult = analyzeDockerfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const analysis = dockerfileService.analyzeDockerfile(parseResult.data.content);
    res.json(createSuccessResponse(analysis, 'Dockerfile analyzed successfully'));
  } catch (error) {
    next(error);
  }
}

export function startBuild(req: Request, res: Response, next: NextFunction): void {
  try {
    const parseResult = buildDockerfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      const issueMessage = parseResult.error.issues.map((i) => i.message).join(', ');
      throw new ValidationError(issueMessage);
    }
    const { name, tag, content, buildArgs } = parseResult.data;
    const buildId = dockerfileService.startBuild(name, tag || 'latest', content, buildArgs);
    res.status(201).json(createSuccessResponse({ buildId }, 'Dockerfile image build started successfully'));
  } catch (error) {
    next(error);
  }
}

export function getBuildProgress(req: Request, res: Response, next: NextFunction): void {
  try {
    const progress = dockerfileService.getBuildProgress(req.params.buildId);
    res.json(createSuccessResponse(progress, 'Build progress retrieved successfully'));
  } catch (error) {
    next(error);
  }
}

export function getBuildHistory(req: Request, res: Response, next: NextFunction): void {
  try {
    const history = dockerfileService.getBuildHistory();
    res.json(createSuccessResponse(history, 'Build history retrieved successfully'));
  } catch (error) {
    next(error);
  }
}
