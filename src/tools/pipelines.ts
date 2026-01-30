/**
 * GitLab Pipeline and Job Tools
 *
 * MCP tools for managing GitLab CI/CD pipelines and jobs.
 */

import { z } from 'zod';
import type { GitLabClient } from '../client.js';
import {
  formatPipelineAsMarkdown,
  formatPipelinesListAsMarkdown,
  formatJobAsMarkdown,
  formatJobsListAsMarkdown,
} from '../utils/formatters.js';

// =============================================================================
// Schemas
// =============================================================================

export const ListPipelinesSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  ref: z.string().optional().describe('Filter by ref (branch or tag)'),
  status: z.enum(['created', 'waiting_for_resource', 'preparing', 'pending', 'running', 'success', 'failed', 'canceled', 'skipped', 'manual', 'scheduled']).optional().describe('Filter by status'),
  scope: z.string().optional().describe('Filter by scope'),
  orderBy: z.string().optional().describe('Order by field'),
  sort: z.enum(['asc', 'desc']).optional().describe('Sort direction'),
  perPage: z.number().optional().describe('Results per page'),
  page: z.number().optional().describe('Page number'),
});

export const GetPipelineSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  pipelineId: z.number().describe('Pipeline ID'),
});

export const CreatePipelineSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  ref: z.string().describe('Branch or tag to run pipeline on'),
  variables: z.array(z.object({
    key: z.string().describe('Variable key'),
    value: z.string().describe('Variable value'),
    variableType: z.string().optional().describe('Variable type'),
  })).optional().describe('Pipeline variables'),
});

export const RetryPipelineSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  pipelineId: z.number().describe('Pipeline ID'),
});

export const CancelPipelineSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  pipelineId: z.number().describe('Pipeline ID'),
});

export const DeletePipelineSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  pipelineId: z.number().describe('Pipeline ID'),
});

// Job schemas
export const ListPipelineJobsSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  pipelineId: z.number().describe('Pipeline ID'),
  scope: z.string().optional().describe('Filter by scope (created, pending, running, failed, success, canceled, skipped, manual)'),
  perPage: z.number().optional().describe('Results per page'),
  page: z.number().optional().describe('Page number'),
});

export const GetJobSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  jobId: z.number().describe('Job ID'),
});

export const GetJobLogSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  jobId: z.number().describe('Job ID'),
});

export const RetryJobSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  jobId: z.number().describe('Job ID'),
});

export const CancelJobSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  jobId: z.number().describe('Job ID'),
});

export const PlayJobSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  jobId: z.number().describe('Job ID'),
});

// =============================================================================
// Tool Definitions
// =============================================================================

export const pipelineTools = [
  {
    name: 'gitlab_list_pipelines',
    description: 'List pipelines in a GitLab project',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        ref: { type: 'string', description: 'Filter by ref' },
        status: { type: 'string', enum: ['created', 'waiting_for_resource', 'preparing', 'pending', 'running', 'success', 'failed', 'canceled', 'skipped', 'manual', 'scheduled'], description: 'Filter by status' },
        scope: { type: 'string', description: 'Filter by scope' },
        orderBy: { type: 'string', description: 'Order by field' },
        sort: { type: 'string', enum: ['asc', 'desc'], description: 'Sort direction' },
        perPage: { type: 'number', description: 'Results per page' },
        page: { type: 'number', description: 'Page number' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'gitlab_get_pipeline',
    description: 'Get details of a specific pipeline',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        pipelineId: { type: 'number', description: 'Pipeline ID' },
      },
      required: ['projectId', 'pipelineId'],
    },
  },
  {
    name: 'gitlab_create_pipeline',
    description: 'Create/trigger a new pipeline',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        ref: { type: 'string', description: 'Branch or tag to run pipeline on' },
        variables: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string' },
              value: { type: 'string' },
              variableType: { type: 'string' },
            },
            required: ['key', 'value'],
          },
          description: 'Pipeline variables',
        },
      },
      required: ['projectId', 'ref'],
    },
  },
  {
    name: 'gitlab_retry_pipeline',
    description: 'Retry failed jobs in a pipeline',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        pipelineId: { type: 'number', description: 'Pipeline ID' },
      },
      required: ['projectId', 'pipelineId'],
    },
  },
  {
    name: 'gitlab_cancel_pipeline',
    description: 'Cancel a running pipeline',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        pipelineId: { type: 'number', description: 'Pipeline ID' },
      },
      required: ['projectId', 'pipelineId'],
    },
  },
  {
    name: 'gitlab_delete_pipeline',
    description: 'Delete a pipeline',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        pipelineId: { type: 'number', description: 'Pipeline ID' },
      },
      required: ['projectId', 'pipelineId'],
    },
  },
  // Job tools
  {
    name: 'gitlab_list_pipeline_jobs',
    description: 'List jobs in a pipeline',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        pipelineId: { type: 'number', description: 'Pipeline ID' },
        scope: { type: 'string', description: 'Filter by scope' },
        perPage: { type: 'number', description: 'Results per page' },
        page: { type: 'number', description: 'Page number' },
      },
      required: ['projectId', 'pipelineId'],
    },
  },
  {
    name: 'gitlab_get_job',
    description: 'Get details of a specific job',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        jobId: { type: 'number', description: 'Job ID' },
      },
      required: ['projectId', 'jobId'],
    },
  },
  {
    name: 'gitlab_get_job_log',
    description: 'Get the log/trace of a job',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        jobId: { type: 'number', description: 'Job ID' },
      },
      required: ['projectId', 'jobId'],
    },
  },
  {
    name: 'gitlab_retry_job',
    description: 'Retry a failed job',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        jobId: { type: 'number', description: 'Job ID' },
      },
      required: ['projectId', 'jobId'],
    },
  },
  {
    name: 'gitlab_cancel_job',
    description: 'Cancel a running job',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        jobId: { type: 'number', description: 'Job ID' },
      },
      required: ['projectId', 'jobId'],
    },
  },
  {
    name: 'gitlab_play_job',
    description: 'Trigger a manual job',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        jobId: { type: 'number', description: 'Job ID' },
      },
      required: ['projectId', 'jobId'],
    },
  },
];

// =============================================================================
// Tool Handlers
// =============================================================================

export async function handlePipelineTool(
  toolName: string,
  args: Record<string, unknown>,
  client: GitLabClient
): Promise<string> {
  switch (toolName) {
    case 'gitlab_list_pipelines': {
      const { projectId, ...params } = ListPipelinesSchema.parse(args);
      const response = await client.listPipelines(projectId, params);
      return formatPipelinesListAsMarkdown(response);
    }

    case 'gitlab_get_pipeline': {
      const { projectId, pipelineId } = GetPipelineSchema.parse(args);
      const pipeline = await client.getPipeline(projectId, pipelineId);
      return formatPipelineAsMarkdown(pipeline);
    }

    case 'gitlab_create_pipeline': {
      const { projectId, ref, variables } = CreatePipelineSchema.parse(args);
      const pipeline = await client.createPipeline(projectId, {
        ref,
        variables: variables?.map(v => ({
          key: v.key,
          value: v.value,
          variable_type: v.variableType,
        })),
      });
      return `Pipeline created successfully:\n\n${formatPipelineAsMarkdown(pipeline)}`;
    }

    case 'gitlab_retry_pipeline': {
      const { projectId, pipelineId } = RetryPipelineSchema.parse(args);
      const pipeline = await client.retryPipeline(projectId, pipelineId);
      return `Pipeline retried:\n\n${formatPipelineAsMarkdown(pipeline)}`;
    }

    case 'gitlab_cancel_pipeline': {
      const { projectId, pipelineId } = CancelPipelineSchema.parse(args);
      const pipeline = await client.cancelPipeline(projectId, pipelineId);
      return `Pipeline canceled:\n\n${formatPipelineAsMarkdown(pipeline)}`;
    }

    case 'gitlab_delete_pipeline': {
      const { projectId, pipelineId } = DeletePipelineSchema.parse(args);
      await client.deletePipeline(projectId, pipelineId);
      return `Pipeline ${pipelineId} deleted successfully.`;
    }

    // Job handlers
    case 'gitlab_list_pipeline_jobs': {
      const { projectId, pipelineId, ...params } = ListPipelineJobsSchema.parse(args);
      const response = await client.listPipelineJobs(projectId, pipelineId, params);
      return formatJobsListAsMarkdown(response);
    }

    case 'gitlab_get_job': {
      const { projectId, jobId } = GetJobSchema.parse(args);
      const job = await client.getJob(projectId, jobId);
      return formatJobAsMarkdown(job);
    }

    case 'gitlab_get_job_log': {
      const { projectId, jobId } = GetJobLogSchema.parse(args);
      const log = await client.getJobLog(projectId, jobId);
      return `# Job Log\n\n\`\`\`\n${log}\n\`\`\``;
    }

    case 'gitlab_retry_job': {
      const { projectId, jobId } = RetryJobSchema.parse(args);
      const job = await client.retryJob(projectId, jobId);
      return `Job retried:\n\n${formatJobAsMarkdown(job)}`;
    }

    case 'gitlab_cancel_job': {
      const { projectId, jobId } = CancelJobSchema.parse(args);
      const job = await client.cancelJob(projectId, jobId);
      return `Job canceled:\n\n${formatJobAsMarkdown(job)}`;
    }

    case 'gitlab_play_job': {
      const { projectId, jobId } = PlayJobSchema.parse(args);
      const job = await client.playJob(projectId, jobId);
      return `Job triggered:\n\n${formatJobAsMarkdown(job)}`;
    }

    default:
      throw new Error(`Unknown pipeline/job tool: ${toolName}`);
  }
}
