/**
 * GitLab Issue Tools
 *
 * MCP tools for managing GitLab issues.
 */

import { z } from 'zod';
import type { GitLabClient } from '../client.js';
import {
  formatIssueAsMarkdown,
  formatIssuesListAsMarkdown,
  formatNoteAsMarkdown,
  formatNotesListAsMarkdown,
} from '../utils/formatters.js';

// =============================================================================
// Schemas
// =============================================================================

export const ListIssuesSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  state: z.enum(['opened', 'closed', 'all']).optional().describe('Filter by state'),
  labels: z.string().optional().describe('Filter by labels (comma-separated)'),
  milestone: z.string().optional().describe('Filter by milestone title'),
  scope: z.string().optional().describe('Filter by scope (created_by_me, assigned_to_me, all)'),
  authorId: z.number().optional().describe('Filter by author ID'),
  assigneeId: z.number().optional().describe('Filter by assignee ID'),
  search: z.string().optional().describe('Search in title and description'),
  orderBy: z.string().optional().describe('Order by field'),
  sort: z.enum(['asc', 'desc']).optional().describe('Sort direction'),
  perPage: z.number().optional().describe('Results per page'),
  page: z.number().optional().describe('Page number'),
});

export const GetIssueSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  issueIid: z.number().describe('Issue IID'),
});

export const CreateIssueSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  title: z.string().describe('Issue title'),
  description: z.string().optional().describe('Issue description'),
  assigneeId: z.number().optional().describe('Assignee user ID'),
  assigneeIds: z.array(z.number()).optional().describe('Multiple assignee IDs'),
  labels: z.string().optional().describe('Labels (comma-separated)'),
  milestoneId: z.number().optional().describe('Milestone ID'),
  dueDate: z.string().optional().describe('Due date (YYYY-MM-DD)'),
  confidential: z.boolean().optional().describe('Mark as confidential'),
  weight: z.number().optional().describe('Issue weight'),
  issueType: z.enum(['issue', 'incident', 'test_case', 'task']).optional().describe('Issue type'),
});

export const UpdateIssueSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  issueIid: z.number().describe('Issue IID'),
  title: z.string().optional().describe('New title'),
  description: z.string().optional().describe('New description'),
  assigneeId: z.number().optional().describe('New assignee ID'),
  assigneeIds: z.array(z.number()).optional().describe('New assignee IDs'),
  labels: z.string().optional().describe('New labels'),
  milestoneId: z.number().optional().describe('New milestone ID'),
  stateEvent: z.enum(['close', 'reopen']).optional().describe('State change event'),
  dueDate: z.string().optional().describe('New due date'),
  confidential: z.boolean().optional().describe('Confidential status'),
  weight: z.number().optional().describe('New weight'),
});

export const DeleteIssueSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  issueIid: z.number().describe('Issue IID'),
});

// Note schemas
export const ListIssueNotesSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  issueIid: z.number().describe('Issue IID'),
  perPage: z.number().optional().describe('Results per page'),
  page: z.number().optional().describe('Page number'),
});

export const CreateIssueNoteSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  issueIid: z.number().describe('Issue IID'),
  body: z.string().describe('Note body (Markdown supported)'),
  internal: z.boolean().optional().describe('Make note internal (visible only to team)'),
});

// =============================================================================
// Tool Definitions
// =============================================================================

export const issueTools = [
  {
    name: 'gitlab_list_issues',
    description: 'List issues in a GitLab project',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        state: { type: 'string', enum: ['opened', 'closed', 'all'], description: 'Filter by state' },
        labels: { type: 'string', description: 'Filter by labels' },
        milestone: { type: 'string', description: 'Filter by milestone' },
        scope: { type: 'string', description: 'Filter by scope' },
        authorId: { type: 'number', description: 'Filter by author ID' },
        assigneeId: { type: 'number', description: 'Filter by assignee ID' },
        search: { type: 'string', description: 'Search in title and description' },
        orderBy: { type: 'string', description: 'Order by field' },
        sort: { type: 'string', enum: ['asc', 'desc'], description: 'Sort direction' },
        perPage: { type: 'number', description: 'Results per page' },
        page: { type: 'number', description: 'Page number' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'gitlab_get_issue',
    description: 'Get details of a specific issue',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        issueIid: { type: 'number', description: 'Issue IID' },
      },
      required: ['projectId', 'issueIid'],
    },
  },
  {
    name: 'gitlab_create_issue',
    description: 'Create a new issue',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        title: { type: 'string', description: 'Issue title' },
        description: { type: 'string', description: 'Issue description' },
        assigneeId: { type: 'number', description: 'Assignee ID' },
        assigneeIds: { type: 'array', items: { type: 'number' }, description: 'Assignee IDs' },
        labels: { type: 'string', description: 'Labels' },
        milestoneId: { type: 'number', description: 'Milestone ID' },
        dueDate: { type: 'string', description: 'Due date (YYYY-MM-DD)' },
        confidential: { type: 'boolean', description: 'Confidential' },
        weight: { type: 'number', description: 'Weight' },
        issueType: { type: 'string', enum: ['issue', 'incident', 'test_case', 'task'], description: 'Issue type' },
      },
      required: ['projectId', 'title'],
    },
  },
  {
    name: 'gitlab_update_issue',
    description: 'Update an existing issue',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        issueIid: { type: 'number', description: 'Issue IID' },
        title: { type: 'string', description: 'New title' },
        description: { type: 'string', description: 'New description' },
        assigneeId: { type: 'number', description: 'New assignee ID' },
        assigneeIds: { type: 'array', items: { type: 'number' }, description: 'New assignee IDs' },
        labels: { type: 'string', description: 'New labels' },
        milestoneId: { type: 'number', description: 'New milestone ID' },
        stateEvent: { type: 'string', enum: ['close', 'reopen'], description: 'State change' },
        dueDate: { type: 'string', description: 'New due date' },
        confidential: { type: 'boolean', description: 'Confidential status' },
        weight: { type: 'number', description: 'New weight' },
      },
      required: ['projectId', 'issueIid'],
    },
  },
  {
    name: 'gitlab_delete_issue',
    description: 'Delete an issue (irreversible)',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        issueIid: { type: 'number', description: 'Issue IID' },
      },
      required: ['projectId', 'issueIid'],
    },
  },
  {
    name: 'gitlab_list_issue_notes',
    description: 'List notes/comments on an issue',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        issueIid: { type: 'number', description: 'Issue IID' },
        perPage: { type: 'number', description: 'Results per page' },
        page: { type: 'number', description: 'Page number' },
      },
      required: ['projectId', 'issueIid'],
    },
  },
  {
    name: 'gitlab_create_issue_note',
    description: 'Add a comment/note to an issue',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        issueIid: { type: 'number', description: 'Issue IID' },
        body: { type: 'string', description: 'Note body (Markdown supported)' },
        internal: { type: 'boolean', description: 'Make note internal' },
      },
      required: ['projectId', 'issueIid', 'body'],
    },
  },
];

// =============================================================================
// Tool Handlers
// =============================================================================

export async function handleIssueTool(
  toolName: string,
  args: Record<string, unknown>,
  client: GitLabClient
): Promise<string> {
  switch (toolName) {
    case 'gitlab_list_issues': {
      const { projectId, ...params } = ListIssuesSchema.parse(args);
      const response = await client.listIssues(projectId, params);
      return formatIssuesListAsMarkdown(response);
    }

    case 'gitlab_get_issue': {
      const { projectId, issueIid } = GetIssueSchema.parse(args);
      const issue = await client.getIssue(projectId, issueIid);
      return formatIssueAsMarkdown(issue);
    }

    case 'gitlab_create_issue': {
      const { projectId, ...params } = CreateIssueSchema.parse(args);
      const issue = await client.createIssue(projectId, {
        title: params.title,
        description: params.description,
        assignee_id: params.assigneeId,
        assignee_ids: params.assigneeIds,
        labels: params.labels,
        milestone_id: params.milestoneId,
        due_date: params.dueDate,
        confidential: params.confidential,
        weight: params.weight,
        issue_type: params.issueType,
      });
      return `Issue created successfully:\n\n${formatIssueAsMarkdown(issue)}`;
    }

    case 'gitlab_update_issue': {
      const { projectId, issueIid, ...params } = UpdateIssueSchema.parse(args);
      const issue = await client.updateIssue(projectId, issueIid, {
        title: params.title,
        description: params.description,
        assignee_id: params.assigneeId,
        assignee_ids: params.assigneeIds,
        labels: params.labels,
        milestone_id: params.milestoneId,
        state_event: params.stateEvent,
        due_date: params.dueDate,
        confidential: params.confidential,
        weight: params.weight,
      });
      return `Issue updated successfully:\n\n${formatIssueAsMarkdown(issue)}`;
    }

    case 'gitlab_delete_issue': {
      const { projectId, issueIid } = DeleteIssueSchema.parse(args);
      await client.deleteIssue(projectId, issueIid);
      return `Issue #${issueIid} deleted successfully.`;
    }

    case 'gitlab_list_issue_notes': {
      const { projectId, issueIid, ...params } = ListIssueNotesSchema.parse(args);
      const response = await client.listIssueNotes(projectId, issueIid, params);
      return formatNotesListAsMarkdown(response);
    }

    case 'gitlab_create_issue_note': {
      const { projectId, issueIid, body, internal } = CreateIssueNoteSchema.parse(args);
      const note = await client.createIssueNote(projectId, issueIid, { body, internal });
      return `Note added successfully:\n\n${formatNoteAsMarkdown(note)}`;
    }

    default:
      throw new Error(`Unknown issue tool: ${toolName}`);
  }
}
