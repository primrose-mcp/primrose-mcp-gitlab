/**
 * GitLab Group Tools
 *
 * MCP tools for managing GitLab groups.
 */

import { z } from 'zod';
import type { GitLabClient } from '../client.js';
import {
  formatGroupAsMarkdown,
  formatGroupsListAsMarkdown,
  formatProjectsListAsMarkdown,
} from '../utils/formatters.js';

// =============================================================================
// Schemas
// =============================================================================

export const ListGroupsSchema = z.object({
  search: z.string().optional().describe('Search groups by name'),
  owned: z.boolean().optional().describe('Limit to groups owned by the user'),
  visibility: z.enum(['public', 'internal', 'private']).optional().describe('Filter by visibility'),
  orderBy: z.string().optional().describe('Order by field'),
  sort: z.enum(['asc', 'desc']).optional().describe('Sort direction'),
  perPage: z.number().optional().describe('Results per page'),
  page: z.number().optional().describe('Page number'),
});

export const GetGroupSchema = z.object({
  groupId: z.string().describe('Group ID or URL-encoded path'),
});

export const CreateGroupSchema = z.object({
  name: z.string().describe('Group name'),
  path: z.string().describe('Group path (URL slug)'),
  description: z.string().optional().describe('Group description'),
  visibility: z.enum(['private', 'internal', 'public']).optional().describe('Group visibility'),
  parentId: z.number().optional().describe('Parent group ID for subgroups'),
});

export const UpdateGroupSchema = z.object({
  groupId: z.string().describe('Group ID or URL-encoded path'),
  name: z.string().optional().describe('New group name'),
  path: z.string().optional().describe('New group path'),
  description: z.string().optional().describe('New description'),
  visibility: z.enum(['private', 'internal', 'public']).optional().describe('New visibility'),
});

export const DeleteGroupSchema = z.object({
  groupId: z.string().describe('Group ID or URL-encoded path'),
});

export const ListGroupProjectsSchema = z.object({
  groupId: z.string().describe('Group ID or URL-encoded path'),
  search: z.string().optional().describe('Search projects by name'),
  archived: z.boolean().optional().describe('Filter by archived status'),
  perPage: z.number().optional().describe('Results per page'),
  page: z.number().optional().describe('Page number'),
});

// =============================================================================
// Tool Definitions
// =============================================================================

export const groupTools = [
  {
    name: 'gitlab_list_groups',
    description: 'List GitLab groups accessible to the authenticated user',
    inputSchema: {
      type: 'object' as const,
      properties: {
        search: { type: 'string', description: 'Search groups by name' },
        owned: { type: 'boolean', description: 'Limit to owned groups' },
        visibility: { type: 'string', enum: ['public', 'internal', 'private'], description: 'Filter by visibility' },
        orderBy: { type: 'string', description: 'Order by field' },
        sort: { type: 'string', enum: ['asc', 'desc'], description: 'Sort direction' },
        perPage: { type: 'number', description: 'Results per page' },
        page: { type: 'number', description: 'Page number' },
      },
    },
  },
  {
    name: 'gitlab_get_group',
    description: 'Get details of a specific GitLab group',
    inputSchema: {
      type: 'object' as const,
      properties: {
        groupId: { type: 'string', description: 'Group ID or URL-encoded path' },
      },
      required: ['groupId'],
    },
  },
  {
    name: 'gitlab_create_group',
    description: 'Create a new GitLab group',
    inputSchema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Group name' },
        path: { type: 'string', description: 'Group path (URL slug)' },
        description: { type: 'string', description: 'Group description' },
        visibility: { type: 'string', enum: ['private', 'internal', 'public'], description: 'Visibility' },
        parentId: { type: 'number', description: 'Parent group ID for subgroups' },
      },
      required: ['name', 'path'],
    },
  },
  {
    name: 'gitlab_update_group',
    description: 'Update a GitLab group',
    inputSchema: {
      type: 'object' as const,
      properties: {
        groupId: { type: 'string', description: 'Group ID or URL-encoded path' },
        name: { type: 'string', description: 'New group name' },
        path: { type: 'string', description: 'New group path' },
        description: { type: 'string', description: 'New description' },
        visibility: { type: 'string', enum: ['private', 'internal', 'public'], description: 'New visibility' },
      },
      required: ['groupId'],
    },
  },
  {
    name: 'gitlab_delete_group',
    description: 'Delete a GitLab group (irreversible)',
    inputSchema: {
      type: 'object' as const,
      properties: {
        groupId: { type: 'string', description: 'Group ID or URL-encoded path' },
      },
      required: ['groupId'],
    },
  },
  {
    name: 'gitlab_list_group_projects',
    description: 'List projects in a GitLab group',
    inputSchema: {
      type: 'object' as const,
      properties: {
        groupId: { type: 'string', description: 'Group ID or URL-encoded path' },
        search: { type: 'string', description: 'Search projects by name' },
        archived: { type: 'boolean', description: 'Filter by archived status' },
        perPage: { type: 'number', description: 'Results per page' },
        page: { type: 'number', description: 'Page number' },
      },
      required: ['groupId'],
    },
  },
];

// =============================================================================
// Tool Handlers
// =============================================================================

export async function handleGroupTool(
  toolName: string,
  args: Record<string, unknown>,
  client: GitLabClient
): Promise<string> {
  switch (toolName) {
    case 'gitlab_list_groups': {
      const params = ListGroupsSchema.parse(args);
      const response = await client.listGroups(params);
      return formatGroupsListAsMarkdown(response);
    }

    case 'gitlab_get_group': {
      const { groupId } = GetGroupSchema.parse(args);
      const group = await client.getGroup(groupId);
      return formatGroupAsMarkdown(group);
    }

    case 'gitlab_create_group': {
      const params = CreateGroupSchema.parse(args);
      const group = await client.createGroup({
        name: params.name,
        path: params.path,
        description: params.description,
        visibility: params.visibility,
        parent_id: params.parentId,
      });
      return `Group created successfully:\n\n${formatGroupAsMarkdown(group)}`;
    }

    case 'gitlab_update_group': {
      const { groupId, ...updateParams } = UpdateGroupSchema.parse(args);
      const group = await client.updateGroup(groupId, {
        name: updateParams.name,
        path: updateParams.path,
        description: updateParams.description,
        visibility: updateParams.visibility,
      });
      return `Group updated successfully:\n\n${formatGroupAsMarkdown(group)}`;
    }

    case 'gitlab_delete_group': {
      const { groupId } = DeleteGroupSchema.parse(args);
      await client.deleteGroup(groupId);
      return `Group ${groupId} deleted successfully.`;
    }

    case 'gitlab_list_group_projects': {
      const { groupId, ...params } = ListGroupProjectsSchema.parse(args);
      const response = await client.listGroupProjects(groupId, params);
      return formatProjectsListAsMarkdown(response);
    }

    default:
      throw new Error(`Unknown group tool: ${toolName}`);
  }
}
