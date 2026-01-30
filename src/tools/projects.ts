/**
 * GitLab Project Tools
 *
 * MCP tools for managing GitLab projects.
 */

import { z } from 'zod';
import type { GitLabClient } from '../client.js';
import { formatProjectAsMarkdown, formatProjectsListAsMarkdown } from '../utils/formatters.js';

// =============================================================================
// Schemas
// =============================================================================

export const ListProjectsSchema = z.object({
  membership: z.boolean().optional().describe('Limit to projects the user is a member of'),
  owned: z.boolean().optional().describe('Limit to projects owned by the user'),
  search: z.string().optional().describe('Search projects by name'),
  visibility: z.enum(['public', 'internal', 'private']).optional().describe('Filter by visibility'),
  archived: z.boolean().optional().describe('Filter by archived status'),
  orderBy: z.string().optional().describe('Order by field (id, name, path, created_at, updated_at, last_activity_at)'),
  sort: z.enum(['asc', 'desc']).optional().describe('Sort direction'),
  perPage: z.number().optional().describe('Number of results per page'),
  page: z.number().optional().describe('Page number'),
});

export const GetProjectSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
});

export const CreateProjectSchema = z.object({
  name: z.string().describe('Project name'),
  path: z.string().optional().describe('Project path (slug)'),
  namespaceId: z.number().optional().describe('Namespace ID to create project in'),
  description: z.string().optional().describe('Project description'),
  visibility: z.enum(['private', 'internal', 'public']).optional().describe('Project visibility'),
  initializeWithReadme: z.boolean().optional().describe('Initialize with a README'),
  defaultBranch: z.string().optional().describe('Default branch name'),
});

export const UpdateProjectSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  name: z.string().optional().describe('New project name'),
  description: z.string().optional().describe('New description'),
  visibility: z.enum(['private', 'internal', 'public']).optional().describe('New visibility'),
  defaultBranch: z.string().optional().describe('New default branch'),
  archived: z.boolean().optional().describe('Archive or unarchive project'),
});

export const DeleteProjectSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
});

export const ForkProjectSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path to fork'),
  namespace: z.string().optional().describe('Namespace to fork into'),
});

export const StarProjectSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
});

export const UnstarProjectSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
});

// =============================================================================
// Tool Definitions
// =============================================================================

export const projectTools = [
  {
    name: 'gitlab_list_projects',
    description: 'List GitLab projects accessible to the authenticated user',
    inputSchema: {
      type: 'object' as const,
      properties: {
        membership: { type: 'boolean', description: 'Limit to projects the user is a member of' },
        owned: { type: 'boolean', description: 'Limit to projects owned by the user' },
        search: { type: 'string', description: 'Search projects by name' },
        visibility: { type: 'string', enum: ['public', 'internal', 'private'], description: 'Filter by visibility' },
        archived: { type: 'boolean', description: 'Filter by archived status' },
        orderBy: { type: 'string', description: 'Order by field' },
        sort: { type: 'string', enum: ['asc', 'desc'], description: 'Sort direction' },
        perPage: { type: 'number', description: 'Results per page' },
        page: { type: 'number', description: 'Page number' },
      },
    },
  },
  {
    name: 'gitlab_get_project',
    description: 'Get details of a specific GitLab project',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'gitlab_create_project',
    description: 'Create a new GitLab project',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Project name' },
        path: { type: 'string', description: 'Project path (slug)' },
        namespaceId: { type: 'number', description: 'Namespace ID' },
        description: { type: 'string', description: 'Project description' },
        visibility: { type: 'string', enum: ['private', 'internal', 'public'], description: 'Visibility' },
        initializeWithReadme: { type: 'boolean', description: 'Initialize with README' },
        defaultBranch: { type: 'string', description: 'Default branch name' },
      },
      required: ['name'],
    },
  },
  {
    name: 'gitlab_update_project',
    description: 'Update a GitLab project',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        name: { type: 'string', description: 'New project name' },
        description: { type: 'string', description: 'New description' },
        visibility: { type: 'string', enum: ['private', 'internal', 'public'], description: 'New visibility' },
        defaultBranch: { type: 'string', description: 'New default branch' },
        archived: { type: 'boolean', description: 'Archive status' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'gitlab_delete_project',
    description: 'Delete a GitLab project (irreversible)',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'gitlab_fork_project',
    description: 'Fork a GitLab project',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path to fork' },
        namespace: { type: 'string', description: 'Namespace to fork into' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'gitlab_star_project',
    description: 'Star a GitLab project',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'gitlab_unstar_project',
    description: 'Unstar a GitLab project',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
      },
      required: ['projectId'],
    },
  },
];

// =============================================================================
// Tool Handlers
// =============================================================================

export async function handleProjectTool(
  toolName: string,
  args: Record<string, unknown>,
  client: GitLabClient
): Promise<string> {
  switch (toolName) {
    case 'gitlab_list_projects': {
      const params = ListProjectsSchema.parse(args);
      const response = await client.listProjects(params);
      return formatProjectsListAsMarkdown(response);
    }

    case 'gitlab_get_project': {
      const { projectId } = GetProjectSchema.parse(args);
      const project = await client.getProject(projectId);
      return formatProjectAsMarkdown(project);
    }

    case 'gitlab_create_project': {
      const params = CreateProjectSchema.parse(args);
      const project = await client.createProject({
        name: params.name,
        path: params.path,
        namespace_id: params.namespaceId,
        description: params.description,
        visibility: params.visibility,
        initialize_with_readme: params.initializeWithReadme,
        default_branch: params.defaultBranch,
      });
      return `Project created successfully:\n\n${formatProjectAsMarkdown(project)}`;
    }

    case 'gitlab_update_project': {
      const { projectId, ...updateParams } = UpdateProjectSchema.parse(args);
      const project = await client.updateProject(projectId, {
        name: updateParams.name,
        description: updateParams.description,
        visibility: updateParams.visibility,
        default_branch: updateParams.defaultBranch,
        archived: updateParams.archived,
      });
      return `Project updated successfully:\n\n${formatProjectAsMarkdown(project)}`;
    }

    case 'gitlab_delete_project': {
      const { projectId } = DeleteProjectSchema.parse(args);
      await client.deleteProject(projectId);
      return `Project ${projectId} deleted successfully.`;
    }

    case 'gitlab_fork_project': {
      const { projectId, namespace } = ForkProjectSchema.parse(args);
      const project = await client.forkProject(projectId, namespace);
      return `Project forked successfully:\n\n${formatProjectAsMarkdown(project)}`;
    }

    case 'gitlab_star_project': {
      const { projectId } = StarProjectSchema.parse(args);
      const project = await client.starProject(projectId);
      return `Project starred successfully:\n\n${formatProjectAsMarkdown(project)}`;
    }

    case 'gitlab_unstar_project': {
      const { projectId } = StarProjectSchema.parse(args);
      const project = await client.unstarProject(projectId);
      return `Project unstarred successfully:\n\n${formatProjectAsMarkdown(project)}`;
    }

    default:
      throw new Error(`Unknown project tool: ${toolName}`);
  }
}
