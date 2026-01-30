/**
 * GitLab User Tools
 *
 * MCP tools for GitLab users and authentication.
 */

import { z } from 'zod';
import type { GitLabClient } from '../client.js';
import { formatUserAsMarkdown, formatUsersListAsMarkdown } from '../utils/formatters.js';

// =============================================================================
// Schemas
// =============================================================================

export const TestConnectionSchema = z.object({});

export const GetCurrentUserSchema = z.object({});

export const ListUsersSchema = z.object({
  search: z.string().optional().describe('Search users by name or username'),
  username: z.string().optional().describe('Filter by exact username'),
  active: z.boolean().optional().describe('Filter by active status'),
  blocked: z.boolean().optional().describe('Filter by blocked status'),
  perPage: z.number().optional().describe('Results per page'),
  page: z.number().optional().describe('Page number'),
});

export const GetUserSchema = z.object({
  userId: z.number().describe('User ID'),
});

// =============================================================================
// Tool Definitions
// =============================================================================

export const userTools = [
  {
    name: 'gitlab_test_connection',
    description: 'Test the GitLab API connection and verify credentials',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'gitlab_get_current_user',
    description: 'Get the currently authenticated GitLab user',
    inputSchema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'gitlab_list_users',
    description: 'List GitLab users',
    inputSchema: {
      type: 'object' as const,
      properties: {
        search: { type: 'string', description: 'Search users by name or username' },
        username: { type: 'string', description: 'Filter by exact username' },
        active: { type: 'boolean', description: 'Filter by active status' },
        blocked: { type: 'boolean', description: 'Filter by blocked status' },
        perPage: { type: 'number', description: 'Results per page' },
        page: { type: 'number', description: 'Page number' },
      },
    },
  },
  {
    name: 'gitlab_get_user',
    description: 'Get details of a specific GitLab user',
    inputSchema: {
      type: 'object' as const,
      properties: {
        userId: { type: 'number', description: 'User ID' },
      },
      required: ['userId'],
    },
  },
];

// =============================================================================
// Tool Handlers
// =============================================================================

export async function handleUserTool(
  toolName: string,
  args: Record<string, unknown>,
  client: GitLabClient
): Promise<string> {
  switch (toolName) {
    case 'gitlab_test_connection': {
      const result = await client.testConnection();
      if (result.connected) {
        return `Connection successful! ${result.message}`;
      }
      return `Connection failed: ${result.message}`;
    }

    case 'gitlab_get_current_user': {
      const user = await client.getCurrentUser();
      return formatUserAsMarkdown(user);
    }

    case 'gitlab_list_users': {
      const params = ListUsersSchema.parse(args);
      const response = await client.listUsers(params);
      return formatUsersListAsMarkdown(response);
    }

    case 'gitlab_get_user': {
      const { userId } = GetUserSchema.parse(args);
      const user = await client.getUser(userId);
      return formatUserAsMarkdown(user);
    }

    default:
      throw new Error(`Unknown user tool: ${toolName}`);
  }
}
