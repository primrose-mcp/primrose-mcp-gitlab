/**
 * GitLab Merge Request Tools
 *
 * MCP tools for managing GitLab merge requests.
 */

import { z } from 'zod';
import type { GitLabClient } from '../client.js';
import {
  formatMergeRequestAsMarkdown,
  formatMergeRequestsListAsMarkdown,
  formatDiffAsMarkdown,
} from '../utils/formatters.js';

// =============================================================================
// Schemas
// =============================================================================

export const ListMergeRequestsSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  state: z.enum(['opened', 'closed', 'merged', 'all']).optional().describe('Filter by state'),
  scope: z.string().optional().describe('Filter by scope (created_by_me, assigned_to_me, all)'),
  orderBy: z.string().optional().describe('Order by field'),
  sort: z.enum(['asc', 'desc']).optional().describe('Sort direction'),
  labels: z.string().optional().describe('Filter by labels (comma-separated)'),
  authorId: z.number().optional().describe('Filter by author ID'),
  assigneeId: z.number().optional().describe('Filter by assignee ID'),
  search: z.string().optional().describe('Search in title and description'),
  perPage: z.number().optional().describe('Results per page'),
  page: z.number().optional().describe('Page number'),
});

export const GetMergeRequestSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  mrIid: z.number().describe('Merge request IID'),
});

export const CreateMergeRequestSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  sourceBranch: z.string().describe('Source branch'),
  targetBranch: z.string().describe('Target branch'),
  title: z.string().describe('Merge request title'),
  description: z.string().optional().describe('Merge request description'),
  assigneeId: z.number().optional().describe('Assignee user ID'),
  assigneeIds: z.array(z.number()).optional().describe('Multiple assignee IDs'),
  reviewerIds: z.array(z.number()).optional().describe('Reviewer user IDs'),
  labels: z.string().optional().describe('Labels (comma-separated)'),
  milestoneId: z.number().optional().describe('Milestone ID'),
  removeSourceBranch: z.boolean().optional().describe('Remove source branch after merge'),
  squash: z.boolean().optional().describe('Squash commits on merge'),
  draft: z.boolean().optional().describe('Create as draft'),
});

export const UpdateMergeRequestSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  mrIid: z.number().describe('Merge request IID'),
  title: z.string().optional().describe('New title'),
  description: z.string().optional().describe('New description'),
  targetBranch: z.string().optional().describe('New target branch'),
  assigneeId: z.number().optional().describe('New assignee ID'),
  assigneeIds: z.array(z.number()).optional().describe('New assignee IDs'),
  reviewerIds: z.array(z.number()).optional().describe('New reviewer IDs'),
  labels: z.string().optional().describe('New labels'),
  milestoneId: z.number().optional().describe('New milestone ID'),
  stateEvent: z.enum(['close', 'reopen']).optional().describe('State change event'),
  removeSourceBranch: z.boolean().optional().describe('Remove source branch after merge'),
  squash: z.boolean().optional().describe('Squash commits on merge'),
  draft: z.boolean().optional().describe('Mark as draft or ready'),
});

export const AcceptMergeRequestSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  mrIid: z.number().describe('Merge request IID'),
  mergeWhenPipelineSucceeds: z.boolean().optional().describe('Merge when pipeline succeeds'),
  shouldRemoveSourceBranch: z.boolean().optional().describe('Remove source branch'),
  squash: z.boolean().optional().describe('Squash commits'),
});

export const ApproveMergeRequestSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  mrIid: z.number().describe('Merge request IID'),
});

export const RebaseMergeRequestSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  mrIid: z.number().describe('Merge request IID'),
});

export const GetMergeRequestDiffSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  mrIid: z.number().describe('Merge request IID'),
});

// =============================================================================
// Tool Definitions
// =============================================================================

export const mergeRequestTools = [
  {
    name: 'gitlab_list_merge_requests',
    description: 'List merge requests in a GitLab project',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        state: { type: 'string', enum: ['opened', 'closed', 'merged', 'all'], description: 'Filter by state' },
        scope: { type: 'string', description: 'Filter by scope' },
        orderBy: { type: 'string', description: 'Order by field' },
        sort: { type: 'string', enum: ['asc', 'desc'], description: 'Sort direction' },
        labels: { type: 'string', description: 'Filter by labels' },
        authorId: { type: 'number', description: 'Filter by author ID' },
        assigneeId: { type: 'number', description: 'Filter by assignee ID' },
        search: { type: 'string', description: 'Search in title and description' },
        perPage: { type: 'number', description: 'Results per page' },
        page: { type: 'number', description: 'Page number' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'gitlab_get_merge_request',
    description: 'Get details of a specific merge request',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        mrIid: { type: 'number', description: 'Merge request IID' },
      },
      required: ['projectId', 'mrIid'],
    },
  },
  {
    name: 'gitlab_create_merge_request',
    description: 'Create a new merge request',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        sourceBranch: { type: 'string', description: 'Source branch' },
        targetBranch: { type: 'string', description: 'Target branch' },
        title: { type: 'string', description: 'Merge request title' },
        description: { type: 'string', description: 'Merge request description' },
        assigneeId: { type: 'number', description: 'Assignee ID' },
        assigneeIds: { type: 'array', items: { type: 'number' }, description: 'Assignee IDs' },
        reviewerIds: { type: 'array', items: { type: 'number' }, description: 'Reviewer IDs' },
        labels: { type: 'string', description: 'Labels' },
        milestoneId: { type: 'number', description: 'Milestone ID' },
        removeSourceBranch: { type: 'boolean', description: 'Remove source branch' },
        squash: { type: 'boolean', description: 'Squash commits' },
        draft: { type: 'boolean', description: 'Create as draft' },
      },
      required: ['projectId', 'sourceBranch', 'targetBranch', 'title'],
    },
  },
  {
    name: 'gitlab_update_merge_request',
    description: 'Update an existing merge request',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        mrIid: { type: 'number', description: 'Merge request IID' },
        title: { type: 'string', description: 'New title' },
        description: { type: 'string', description: 'New description' },
        targetBranch: { type: 'string', description: 'New target branch' },
        assigneeId: { type: 'number', description: 'New assignee ID' },
        assigneeIds: { type: 'array', items: { type: 'number' }, description: 'New assignee IDs' },
        reviewerIds: { type: 'array', items: { type: 'number' }, description: 'New reviewer IDs' },
        labels: { type: 'string', description: 'New labels' },
        milestoneId: { type: 'number', description: 'New milestone ID' },
        stateEvent: { type: 'string', enum: ['close', 'reopen'], description: 'State change' },
        removeSourceBranch: { type: 'boolean', description: 'Remove source branch' },
        squash: { type: 'boolean', description: 'Squash commits' },
        draft: { type: 'boolean', description: 'Draft status' },
      },
      required: ['projectId', 'mrIid'],
    },
  },
  {
    name: 'gitlab_accept_merge_request',
    description: 'Merge a merge request (accept and merge)',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        mrIid: { type: 'number', description: 'Merge request IID' },
        mergeWhenPipelineSucceeds: { type: 'boolean', description: 'Merge when pipeline succeeds' },
        shouldRemoveSourceBranch: { type: 'boolean', description: 'Remove source branch' },
        squash: { type: 'boolean', description: 'Squash commits' },
      },
      required: ['projectId', 'mrIid'],
    },
  },
  {
    name: 'gitlab_approve_merge_request',
    description: 'Approve a merge request',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        mrIid: { type: 'number', description: 'Merge request IID' },
      },
      required: ['projectId', 'mrIid'],
    },
  },
  {
    name: 'gitlab_rebase_merge_request',
    description: 'Rebase a merge request',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        mrIid: { type: 'number', description: 'Merge request IID' },
      },
      required: ['projectId', 'mrIid'],
    },
  },
  {
    name: 'gitlab_get_merge_request_diff',
    description: 'Get the diff/changes of a merge request',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        mrIid: { type: 'number', description: 'Merge request IID' },
      },
      required: ['projectId', 'mrIid'],
    },
  },
];

// =============================================================================
// Tool Handlers
// =============================================================================

export async function handleMergeRequestTool(
  toolName: string,
  args: Record<string, unknown>,
  client: GitLabClient
): Promise<string> {
  switch (toolName) {
    case 'gitlab_list_merge_requests': {
      const { projectId, ...params } = ListMergeRequestsSchema.parse(args);
      const response = await client.listMergeRequests(projectId, params);
      return formatMergeRequestsListAsMarkdown(response);
    }

    case 'gitlab_get_merge_request': {
      const { projectId, mrIid } = GetMergeRequestSchema.parse(args);
      const mr = await client.getMergeRequest(projectId, mrIid);
      return formatMergeRequestAsMarkdown(mr);
    }

    case 'gitlab_create_merge_request': {
      const { projectId, ...params } = CreateMergeRequestSchema.parse(args);
      const mr = await client.createMergeRequest(projectId, {
        source_branch: params.sourceBranch,
        target_branch: params.targetBranch,
        title: params.title,
        description: params.description,
        assignee_id: params.assigneeId,
        assignee_ids: params.assigneeIds,
        reviewer_ids: params.reviewerIds,
        labels: params.labels,
        milestone_id: params.milestoneId,
        remove_source_branch: params.removeSourceBranch,
        squash: params.squash,
        draft: params.draft,
      });
      return `Merge request created successfully:\n\n${formatMergeRequestAsMarkdown(mr)}`;
    }

    case 'gitlab_update_merge_request': {
      const { projectId, mrIid, ...params } = UpdateMergeRequestSchema.parse(args);
      const mr = await client.updateMergeRequest(projectId, mrIid, {
        title: params.title,
        description: params.description,
        target_branch: params.targetBranch,
        assignee_id: params.assigneeId,
        assignee_ids: params.assigneeIds,
        reviewer_ids: params.reviewerIds,
        labels: params.labels,
        milestone_id: params.milestoneId,
        state_event: params.stateEvent,
        remove_source_branch: params.removeSourceBranch,
        squash: params.squash,
        draft: params.draft,
      });
      return `Merge request updated successfully:\n\n${formatMergeRequestAsMarkdown(mr)}`;
    }

    case 'gitlab_accept_merge_request': {
      const { projectId, mrIid, ...params } = AcceptMergeRequestSchema.parse(args);
      const mr = await client.acceptMergeRequest(projectId, mrIid, params);
      return `Merge request merged successfully:\n\n${formatMergeRequestAsMarkdown(mr)}`;
    }

    case 'gitlab_approve_merge_request': {
      const { projectId, mrIid } = ApproveMergeRequestSchema.parse(args);
      await client.approveMergeRequest(projectId, mrIid);
      return `Merge request !${mrIid} approved successfully.`;
    }

    case 'gitlab_rebase_merge_request': {
      const { projectId, mrIid } = RebaseMergeRequestSchema.parse(args);
      await client.rebaseMergeRequest(projectId, mrIid);
      return `Merge request !${mrIid} rebase initiated.`;
    }

    case 'gitlab_get_merge_request_diff': {
      const { projectId, mrIid } = GetMergeRequestDiffSchema.parse(args);
      const diffs = await client.getMergeRequestDiff(projectId, mrIid);
      return formatDiffAsMarkdown(diffs);
    }

    default:
      throw new Error(`Unknown merge request tool: ${toolName}`);
  }
}
