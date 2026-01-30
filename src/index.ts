/**
 * GitLab MCP Server - Main Entry Point
 *
 * This file sets up the MCP server using Cloudflare's Agents SDK.
 * It supports both stateless (McpServer) and stateful (McpAgent) modes.
 *
 * MULTI-TENANT ARCHITECTURE:
 * Tenant credentials (API keys, etc.) are parsed from request headers,
 * allowing a single server deployment to serve multiple customers.
 *
 * Required Headers:
 * - X-GitLab-Token: Private token for GitLab API authentication
 *
 * Optional Headers:
 * - X-GitLab-Base-URL: Override the default GitLab API base URL (default: https://gitlab.com)
 * - X-GitLab-Access-Token: OAuth access token (alternative to private token)
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpAgent } from 'agents/mcp';
import { createGitLabClient, type GitLabClient } from './client.js';
import {
  handleProjectTool,
  handleRepositoryTool,
  handleMergeRequestTool,
  handleIssueTool,
  handlePipelineTool,
  handleGroupTool,
  handleUserTool,
} from './tools/index.js';
import {
  type Env,
  type TenantCredentials,
  parseTenantCredentials,
  validateCredentials,
} from './types/env.js';

// Import Zod schemas from each tool file
import {
  ListProjectsSchema,
  GetProjectSchema,
  CreateProjectSchema,
  UpdateProjectSchema,
  DeleteProjectSchema,
  ForkProjectSchema,
  StarProjectSchema,
  UnstarProjectSchema,
} from './tools/projects.js';

import {
  ListBranchesSchema,
  GetBranchSchema,
  CreateBranchSchema,
  DeleteBranchSchema,
  DeleteMergedBranchesSchema,
  ListCommitsSchema,
  GetCommitSchema,
  CreateCommitSchema,
  GetCommitDiffSchema,
  CherryPickCommitSchema,
  RevertCommitSchema,
  ListTagsSchema,
  GetTagSchema,
  CreateTagSchema,
  DeleteTagSchema,
  GetRepositoryTreeSchema,
  CompareRefsSchema,
  GetFileSchema,
  GetFileRawSchema,
  CreateFileSchema,
  UpdateFileSchema,
  DeleteFileSchema,
} from './tools/repository.js';

import {
  ListMergeRequestsSchema,
  GetMergeRequestSchema,
  CreateMergeRequestSchema,
  UpdateMergeRequestSchema,
  AcceptMergeRequestSchema,
  ApproveMergeRequestSchema,
  RebaseMergeRequestSchema,
  GetMergeRequestDiffSchema,
} from './tools/merge-requests.js';

import {
  ListIssuesSchema,
  GetIssueSchema,
  CreateIssueSchema,
  UpdateIssueSchema,
  DeleteIssueSchema,
  ListIssueNotesSchema,
  CreateIssueNoteSchema,
} from './tools/issues.js';

import {
  ListPipelinesSchema,
  GetPipelineSchema,
  CreatePipelineSchema,
  RetryPipelineSchema,
  CancelPipelineSchema,
  DeletePipelineSchema,
  ListPipelineJobsSchema,
  GetJobSchema,
  GetJobLogSchema,
  RetryJobSchema,
  CancelJobSchema,
  PlayJobSchema,
} from './tools/pipelines.js';

import {
  ListGroupsSchema,
  GetGroupSchema,
  CreateGroupSchema,
  UpdateGroupSchema,
  DeleteGroupSchema,
  ListGroupProjectsSchema,
} from './tools/groups.js';

import {
  TestConnectionSchema,
  GetCurrentUserSchema,
  ListUsersSchema,
  GetUserSchema,
} from './tools/users.js';

// =============================================================================
// MCP Server Configuration
// =============================================================================

const SERVER_NAME = 'gitlab-mcp-server';
const SERVER_VERSION = '1.0.0';

// =============================================================================
// MCP Agent (Stateful - uses Durable Objects)
// =============================================================================

/**
 * McpAgent provides stateful MCP sessions backed by Durable Objects.
 *
 * NOTE: For multi-tenant deployments, use the stateless mode (Option 2) instead.
 * The stateful McpAgent is better suited for single-tenant deployments where
 * credentials can be stored as wrangler secrets.
 *
 * @deprecated For multi-tenant support, use stateless mode with per-request credentials
 */
export class GitLabMcpAgent extends McpAgent<Env> {
  server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  async init() {
    throw new Error(
      'Stateful mode (McpAgent) is not supported for multi-tenant deployments. ' +
        'Use the stateless /mcp endpoint with X-GitLab-Token header instead.'
    );
  }
}

// =============================================================================
// Tool Registration Helper
// =============================================================================

function registerTools(server: McpServer, client: GitLabClient): void {
  // User tools
  server.tool('gitlab_test_connection', 'Test the GitLab API connection and verify credentials', TestConnectionSchema.shape, async () => {
    const result = await handleUserTool('gitlab_test_connection', {}, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_get_current_user', 'Get the currently authenticated GitLab user', GetCurrentUserSchema.shape, async () => {
    const result = await handleUserTool('gitlab_get_current_user', {}, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_list_users', 'List GitLab users', ListUsersSchema.shape, async (args) => {
    const result = await handleUserTool('gitlab_list_users', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_get_user', 'Get details of a specific GitLab user', GetUserSchema.shape, async (args) => {
    const result = await handleUserTool('gitlab_get_user', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  // Project tools
  server.tool('gitlab_list_projects', 'List GitLab projects accessible to the authenticated user', ListProjectsSchema.shape, async (args) => {
    const result = await handleProjectTool('gitlab_list_projects', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_get_project', 'Get details of a specific GitLab project', GetProjectSchema.shape, async (args) => {
    const result = await handleProjectTool('gitlab_get_project', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_create_project', 'Create a new GitLab project', CreateProjectSchema.shape, async (args) => {
    const result = await handleProjectTool('gitlab_create_project', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_update_project', 'Update a GitLab project', UpdateProjectSchema.shape, async (args) => {
    const result = await handleProjectTool('gitlab_update_project', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_delete_project', 'Delete a GitLab project (irreversible)', DeleteProjectSchema.shape, async (args) => {
    const result = await handleProjectTool('gitlab_delete_project', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_fork_project', 'Fork a GitLab project', ForkProjectSchema.shape, async (args) => {
    const result = await handleProjectTool('gitlab_fork_project', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_star_project', 'Star a GitLab project', StarProjectSchema.shape, async (args) => {
    const result = await handleProjectTool('gitlab_star_project', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_unstar_project', 'Unstar a GitLab project', UnstarProjectSchema.shape, async (args) => {
    const result = await handleProjectTool('gitlab_unstar_project', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  // Repository - Branch tools
  server.tool('gitlab_list_branches', 'List branches in a GitLab project', ListBranchesSchema.shape, async (args) => {
    const result = await handleRepositoryTool('gitlab_list_branches', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_get_branch', 'Get details of a specific branch', GetBranchSchema.shape, async (args) => {
    const result = await handleRepositoryTool('gitlab_get_branch', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_create_branch', 'Create a new branch', CreateBranchSchema.shape, async (args) => {
    const result = await handleRepositoryTool('gitlab_create_branch', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_delete_branch', 'Delete a branch', DeleteBranchSchema.shape, async (args) => {
    const result = await handleRepositoryTool('gitlab_delete_branch', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_delete_merged_branches', 'Delete all merged branches', DeleteMergedBranchesSchema.shape, async (args) => {
    const result = await handleRepositoryTool('gitlab_delete_merged_branches', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  // Repository - Commit tools
  server.tool('gitlab_list_commits', 'List commits in a GitLab project', ListCommitsSchema.shape, async (args) => {
    const result = await handleRepositoryTool('gitlab_list_commits', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_get_commit', 'Get details of a specific commit', GetCommitSchema.shape, async (args) => {
    const result = await handleRepositoryTool('gitlab_get_commit', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_create_commit', 'Create a new commit with file changes', CreateCommitSchema.shape, async (args) => {
    const result = await handleRepositoryTool('gitlab_create_commit', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_get_commit_diff', 'Get the diff for a commit', GetCommitDiffSchema.shape, async (args) => {
    const result = await handleRepositoryTool('gitlab_get_commit_diff', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_cherry_pick_commit', 'Cherry-pick a commit to a branch', CherryPickCommitSchema.shape, async (args) => {
    const result = await handleRepositoryTool('gitlab_cherry_pick_commit', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_revert_commit', 'Revert a commit', RevertCommitSchema.shape, async (args) => {
    const result = await handleRepositoryTool('gitlab_revert_commit', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  // Repository - Tag tools
  server.tool('gitlab_list_tags', 'List tags in a GitLab project', ListTagsSchema.shape, async (args) => {
    const result = await handleRepositoryTool('gitlab_list_tags', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_get_tag', 'Get details of a specific tag', GetTagSchema.shape, async (args) => {
    const result = await handleRepositoryTool('gitlab_get_tag', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_create_tag', 'Create a new tag', CreateTagSchema.shape, async (args) => {
    const result = await handleRepositoryTool('gitlab_create_tag', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_delete_tag', 'Delete a tag', DeleteTagSchema.shape, async (args) => {
    const result = await handleRepositoryTool('gitlab_delete_tag', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  // Repository - Tree and Compare
  server.tool('gitlab_get_repository_tree', 'Get the repository file tree', GetRepositoryTreeSchema.shape, async (args) => {
    const result = await handleRepositoryTool('gitlab_get_repository_tree', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_compare_refs', 'Compare two branches, tags, or commits', CompareRefsSchema.shape, async (args) => {
    const result = await handleRepositoryTool('gitlab_compare_refs', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  // Repository - File tools
  server.tool('gitlab_get_file', 'Get a file from the repository', GetFileSchema.shape, async (args) => {
    const result = await handleRepositoryTool('gitlab_get_file', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_get_file_raw', 'Get raw file content from the repository', GetFileRawSchema.shape, async (args) => {
    const result = await handleRepositoryTool('gitlab_get_file_raw', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_create_file', 'Create a new file in the repository', CreateFileSchema.shape, async (args) => {
    const result = await handleRepositoryTool('gitlab_create_file', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_update_file', 'Update an existing file in the repository', UpdateFileSchema.shape, async (args) => {
    const result = await handleRepositoryTool('gitlab_update_file', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_delete_file', 'Delete a file from the repository', DeleteFileSchema.shape, async (args) => {
    const result = await handleRepositoryTool('gitlab_delete_file', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  // Merge Request tools
  server.tool('gitlab_list_merge_requests', 'List merge requests in a GitLab project', ListMergeRequestsSchema.shape, async (args) => {
    const result = await handleMergeRequestTool('gitlab_list_merge_requests', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_get_merge_request', 'Get details of a specific merge request', GetMergeRequestSchema.shape, async (args) => {
    const result = await handleMergeRequestTool('gitlab_get_merge_request', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_create_merge_request', 'Create a new merge request', CreateMergeRequestSchema.shape, async (args) => {
    const result = await handleMergeRequestTool('gitlab_create_merge_request', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_update_merge_request', 'Update an existing merge request', UpdateMergeRequestSchema.shape, async (args) => {
    const result = await handleMergeRequestTool('gitlab_update_merge_request', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_accept_merge_request', 'Merge a merge request (accept and merge)', AcceptMergeRequestSchema.shape, async (args) => {
    const result = await handleMergeRequestTool('gitlab_accept_merge_request', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_approve_merge_request', 'Approve a merge request', ApproveMergeRequestSchema.shape, async (args) => {
    const result = await handleMergeRequestTool('gitlab_approve_merge_request', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_rebase_merge_request', 'Rebase a merge request', RebaseMergeRequestSchema.shape, async (args) => {
    const result = await handleMergeRequestTool('gitlab_rebase_merge_request', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_get_merge_request_diff', 'Get the diff/changes of a merge request', GetMergeRequestDiffSchema.shape, async (args) => {
    const result = await handleMergeRequestTool('gitlab_get_merge_request_diff', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  // Issue tools
  server.tool('gitlab_list_issues', 'List issues in a GitLab project', ListIssuesSchema.shape, async (args) => {
    const result = await handleIssueTool('gitlab_list_issues', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_get_issue', 'Get details of a specific issue', GetIssueSchema.shape, async (args) => {
    const result = await handleIssueTool('gitlab_get_issue', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_create_issue', 'Create a new issue', CreateIssueSchema.shape, async (args) => {
    const result = await handleIssueTool('gitlab_create_issue', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_update_issue', 'Update an existing issue', UpdateIssueSchema.shape, async (args) => {
    const result = await handleIssueTool('gitlab_update_issue', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_delete_issue', 'Delete an issue (irreversible)', DeleteIssueSchema.shape, async (args) => {
    const result = await handleIssueTool('gitlab_delete_issue', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_list_issue_notes', 'List notes/comments on an issue', ListIssueNotesSchema.shape, async (args) => {
    const result = await handleIssueTool('gitlab_list_issue_notes', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_create_issue_note', 'Add a comment/note to an issue', CreateIssueNoteSchema.shape, async (args) => {
    const result = await handleIssueTool('gitlab_create_issue_note', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  // Pipeline tools
  server.tool('gitlab_list_pipelines', 'List pipelines in a GitLab project', ListPipelinesSchema.shape, async (args) => {
    const result = await handlePipelineTool('gitlab_list_pipelines', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_get_pipeline', 'Get details of a specific pipeline', GetPipelineSchema.shape, async (args) => {
    const result = await handlePipelineTool('gitlab_get_pipeline', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_create_pipeline', 'Create/trigger a new pipeline', CreatePipelineSchema.shape, async (args) => {
    const result = await handlePipelineTool('gitlab_create_pipeline', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_retry_pipeline', 'Retry failed jobs in a pipeline', RetryPipelineSchema.shape, async (args) => {
    const result = await handlePipelineTool('gitlab_retry_pipeline', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_cancel_pipeline', 'Cancel a running pipeline', CancelPipelineSchema.shape, async (args) => {
    const result = await handlePipelineTool('gitlab_cancel_pipeline', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_delete_pipeline', 'Delete a pipeline', DeletePipelineSchema.shape, async (args) => {
    const result = await handlePipelineTool('gitlab_delete_pipeline', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  // Job tools
  server.tool('gitlab_list_pipeline_jobs', 'List jobs in a pipeline', ListPipelineJobsSchema.shape, async (args) => {
    const result = await handlePipelineTool('gitlab_list_pipeline_jobs', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_get_job', 'Get details of a specific job', GetJobSchema.shape, async (args) => {
    const result = await handlePipelineTool('gitlab_get_job', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_get_job_log', 'Get the log/trace of a job', GetJobLogSchema.shape, async (args) => {
    const result = await handlePipelineTool('gitlab_get_job_log', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_retry_job', 'Retry a failed job', RetryJobSchema.shape, async (args) => {
    const result = await handlePipelineTool('gitlab_retry_job', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_cancel_job', 'Cancel a running job', CancelJobSchema.shape, async (args) => {
    const result = await handlePipelineTool('gitlab_cancel_job', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_play_job', 'Trigger a manual job', PlayJobSchema.shape, async (args) => {
    const result = await handlePipelineTool('gitlab_play_job', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  // Group tools
  server.tool('gitlab_list_groups', 'List GitLab groups accessible to the authenticated user', ListGroupsSchema.shape, async (args) => {
    const result = await handleGroupTool('gitlab_list_groups', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_get_group', 'Get details of a specific GitLab group', GetGroupSchema.shape, async (args) => {
    const result = await handleGroupTool('gitlab_get_group', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_create_group', 'Create a new GitLab group', CreateGroupSchema.shape, async (args) => {
    const result = await handleGroupTool('gitlab_create_group', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_update_group', 'Update a GitLab group', UpdateGroupSchema.shape, async (args) => {
    const result = await handleGroupTool('gitlab_update_group', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_delete_group', 'Delete a GitLab group (irreversible)', DeleteGroupSchema.shape, async (args) => {
    const result = await handleGroupTool('gitlab_delete_group', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });

  server.tool('gitlab_list_group_projects', 'List projects in a GitLab group', ListGroupProjectsSchema.shape, async (args) => {
    const result = await handleGroupTool('gitlab_list_group_projects', args, client);
    return { content: [{ type: 'text' as const, text: result }] };
  });
}

// =============================================================================
// Stateless MCP Server (Recommended - no Durable Objects needed)
// =============================================================================

/**
 * Creates a stateless MCP server instance with tenant-specific credentials.
 *
 * MULTI-TENANT: Each request provides credentials via headers, allowing
 * a single server deployment to serve multiple tenants.
 *
 * @param credentials - Tenant credentials parsed from request headers
 */
function createStatelessServer(credentials: TenantCredentials): McpServer {
  const server = new McpServer({
    name: SERVER_NAME,
    version: SERVER_VERSION,
  });

  // Create client with tenant-specific credentials
  const client = createGitLabClient(credentials);

  // Register all tools
  registerTools(server, client);

  return server;
}

// =============================================================================
// Worker Export
// =============================================================================

const TOOL_NAMES = [
  'gitlab_test_connection',
  'gitlab_get_current_user',
  'gitlab_list_users',
  'gitlab_get_user',
  'gitlab_list_projects',
  'gitlab_get_project',
  'gitlab_create_project',
  'gitlab_update_project',
  'gitlab_delete_project',
  'gitlab_fork_project',
  'gitlab_star_project',
  'gitlab_unstar_project',
  'gitlab_list_branches',
  'gitlab_get_branch',
  'gitlab_create_branch',
  'gitlab_delete_branch',
  'gitlab_delete_merged_branches',
  'gitlab_list_commits',
  'gitlab_get_commit',
  'gitlab_create_commit',
  'gitlab_get_commit_diff',
  'gitlab_cherry_pick_commit',
  'gitlab_revert_commit',
  'gitlab_list_tags',
  'gitlab_get_tag',
  'gitlab_create_tag',
  'gitlab_delete_tag',
  'gitlab_get_repository_tree',
  'gitlab_compare_refs',
  'gitlab_get_file',
  'gitlab_get_file_raw',
  'gitlab_create_file',
  'gitlab_update_file',
  'gitlab_delete_file',
  'gitlab_list_merge_requests',
  'gitlab_get_merge_request',
  'gitlab_create_merge_request',
  'gitlab_update_merge_request',
  'gitlab_accept_merge_request',
  'gitlab_approve_merge_request',
  'gitlab_rebase_merge_request',
  'gitlab_get_merge_request_diff',
  'gitlab_list_issues',
  'gitlab_get_issue',
  'gitlab_create_issue',
  'gitlab_update_issue',
  'gitlab_delete_issue',
  'gitlab_list_issue_notes',
  'gitlab_create_issue_note',
  'gitlab_list_pipelines',
  'gitlab_get_pipeline',
  'gitlab_create_pipeline',
  'gitlab_retry_pipeline',
  'gitlab_cancel_pipeline',
  'gitlab_delete_pipeline',
  'gitlab_list_pipeline_jobs',
  'gitlab_get_job',
  'gitlab_get_job_log',
  'gitlab_retry_job',
  'gitlab_cancel_job',
  'gitlab_play_job',
  'gitlab_list_groups',
  'gitlab_get_group',
  'gitlab_create_group',
  'gitlab_update_group',
  'gitlab_delete_group',
  'gitlab_list_group_projects',
];

export default {
  /**
   * Main fetch handler for the Worker
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', server: SERVER_NAME }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ==========================================================================
    // Option 2: Stateless MCP with Streamable HTTP (Recommended for multi-tenant)
    // ==========================================================================
    if (url.pathname === '/mcp' && request.method === 'POST') {
      // Parse tenant credentials from request headers
      const credentials = parseTenantCredentials(request);

      // Validate credentials are present
      try {
        validateCredentials(credentials);
      } catch (error) {
        return new Response(
          JSON.stringify({
            error: 'Unauthorized',
            message: error instanceof Error ? error.message : 'Invalid credentials',
            required_headers: ['X-GitLab-Token or X-GitLab-Access-Token'],
          }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Create server with tenant-specific credentials
      const server = createStatelessServer(credentials);

      // Import and use createMcpHandler for streamable HTTP
      const { createMcpHandler } = await import('agents/mcp');
      const handler = createMcpHandler(server);
      return handler(request, env, ctx);
    }

    // SSE endpoint for legacy clients
    if (url.pathname === '/sse') {
      return new Response('SSE endpoint requires Durable Objects. Enable in wrangler.jsonc.', {
        status: 501,
      });
    }

    // Default response
    return new Response(
      JSON.stringify({
        name: SERVER_NAME,
        version: SERVER_VERSION,
        description: 'Multi-tenant GitLab MCP Server',
        endpoints: {
          mcp: '/mcp (POST) - Streamable HTTP MCP endpoint',
          health: '/health - Health check',
        },
        authentication: {
          description: 'Pass tenant credentials via request headers',
          required_headers: {
            'X-GitLab-Token': 'Private token for GitLab API authentication (or use X-GitLab-Access-Token)',
          },
          optional_headers: {
            'X-GitLab-Access-Token': 'OAuth access token (alternative to private token)',
            'X-GitLab-Base-URL': 'Override the default GitLab API base URL (default: https://gitlab.com)',
          },
        },
        tools: TOOL_NAMES,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  },
};
