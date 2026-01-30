/**
 * GitLab Repository Tools
 *
 * MCP tools for managing GitLab repository (branches, commits, tags, files, tree).
 */

import { z } from 'zod';
import type { GitLabClient } from '../client.js';
import {
  formatBranchAsMarkdown,
  formatBranchesListAsMarkdown,
  formatCommitAsMarkdown,
  formatCommitsListAsMarkdown,
  formatTagAsMarkdown,
  formatTagsListAsMarkdown,
  formatFileAsMarkdown,
  formatTreeAsMarkdown,
  formatDiffAsMarkdown,
  formatCompareAsMarkdown,
} from '../utils/formatters.js';

// =============================================================================
// Schemas
// =============================================================================

// Branch schemas
export const ListBranchesSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  search: z.string().optional().describe('Search branches by name'),
  perPage: z.number().optional().describe('Results per page'),
  page: z.number().optional().describe('Page number'),
});

export const GetBranchSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  branchName: z.string().describe('Branch name'),
});

export const CreateBranchSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  branch: z.string().describe('New branch name'),
  ref: z.string().describe('Source branch name or commit SHA'),
});

export const DeleteBranchSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  branchName: z.string().describe('Branch name to delete'),
});

export const DeleteMergedBranchesSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
});

// Commit schemas
export const ListCommitsSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  refName: z.string().optional().describe('Branch or tag name'),
  path: z.string().optional().describe('File path to filter commits'),
  since: z.string().optional().describe('Only commits after this date (ISO 8601)'),
  until: z.string().optional().describe('Only commits before this date (ISO 8601)'),
  withStats: z.boolean().optional().describe('Include commit stats'),
  perPage: z.number().optional().describe('Results per page'),
  page: z.number().optional().describe('Page number'),
});

export const GetCommitSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  sha: z.string().describe('Commit SHA'),
});

export const CreateCommitSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  branch: z.string().describe('Branch to commit to'),
  commitMessage: z.string().describe('Commit message'),
  actions: z.array(z.object({
    action: z.enum(['create', 'delete', 'move', 'update', 'chmod']).describe('Action type'),
    filePath: z.string().describe('File path'),
    content: z.string().optional().describe('File content (for create/update)'),
    previousPath: z.string().optional().describe('Previous path (for move)'),
    encoding: z.enum(['text', 'base64']).optional().describe('Content encoding'),
  })).describe('File actions to perform'),
  authorEmail: z.string().optional().describe('Author email'),
  authorName: z.string().optional().describe('Author name'),
  startBranch: z.string().optional().describe('Start branch for the commit'),
});

export const GetCommitDiffSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  sha: z.string().describe('Commit SHA'),
});

export const CherryPickCommitSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  sha: z.string().describe('Commit SHA to cherry-pick'),
  branch: z.string().describe('Target branch'),
});

export const RevertCommitSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  sha: z.string().describe('Commit SHA to revert'),
  branch: z.string().describe('Target branch'),
});

// Tag schemas
export const ListTagsSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  search: z.string().optional().describe('Search tags by name'),
  orderBy: z.string().optional().describe('Order by field'),
  sort: z.enum(['asc', 'desc']).optional().describe('Sort direction'),
  perPage: z.number().optional().describe('Results per page'),
  page: z.number().optional().describe('Page number'),
});

export const GetTagSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  tagName: z.string().describe('Tag name'),
});

export const CreateTagSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  tagName: z.string().describe('Tag name'),
  ref: z.string().describe('Source commit SHA or branch'),
  message: z.string().optional().describe('Tag message (creates annotated tag)'),
});

export const DeleteTagSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  tagName: z.string().describe('Tag name to delete'),
});

// Tree schemas
export const GetTreeSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  path: z.string().optional().describe('Path inside repository'),
  ref: z.string().optional().describe('Branch or tag name'),
  recursive: z.boolean().optional().describe('Get tree recursively'),
  perPage: z.number().optional().describe('Results per page'),
  page: z.number().optional().describe('Page number'),
});

// Alias for clarity
export const GetRepositoryTreeSchema = GetTreeSchema;

export const CompareRefsSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  from: z.string().describe('Source branch/commit'),
  to: z.string().describe('Target branch/commit'),
});

// File schemas
export const GetFileSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  filePath: z.string().describe('File path'),
  ref: z.string().describe('Branch, tag, or commit'),
});

export const GetFileRawSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  filePath: z.string().describe('File path'),
  ref: z.string().describe('Branch, tag, or commit'),
});

export const CreateFileSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  filePath: z.string().describe('File path'),
  branch: z.string().describe('Branch to create file in'),
  content: z.string().describe('File content'),
  commitMessage: z.string().describe('Commit message'),
  authorEmail: z.string().optional().describe('Author email'),
  authorName: z.string().optional().describe('Author name'),
  encoding: z.enum(['text', 'base64']).optional().describe('Content encoding'),
});

export const UpdateFileSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  filePath: z.string().describe('File path'),
  branch: z.string().describe('Branch to update file in'),
  content: z.string().describe('New file content'),
  commitMessage: z.string().describe('Commit message'),
  authorEmail: z.string().optional().describe('Author email'),
  authorName: z.string().optional().describe('Author name'),
  encoding: z.enum(['text', 'base64']).optional().describe('Content encoding'),
  lastCommitId: z.string().optional().describe('Last known commit ID'),
});

export const DeleteFileSchema = z.object({
  projectId: z.string().describe('Project ID or URL-encoded path'),
  filePath: z.string().describe('File path'),
  branch: z.string().describe('Branch to delete file from'),
  commitMessage: z.string().describe('Commit message'),
  authorEmail: z.string().optional().describe('Author email'),
  authorName: z.string().optional().describe('Author name'),
});

// =============================================================================
// Tool Definitions
// =============================================================================

export const repositoryTools = [
  // Branch tools
  {
    name: 'gitlab_list_branches',
    description: 'List branches in a GitLab project repository',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        search: { type: 'string', description: 'Search branches by name' },
        perPage: { type: 'number', description: 'Results per page' },
        page: { type: 'number', description: 'Page number' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'gitlab_get_branch',
    description: 'Get details of a specific branch',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        branchName: { type: 'string', description: 'Branch name' },
      },
      required: ['projectId', 'branchName'],
    },
  },
  {
    name: 'gitlab_create_branch',
    description: 'Create a new branch in a GitLab project',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        branch: { type: 'string', description: 'New branch name' },
        ref: { type: 'string', description: 'Source branch or commit SHA' },
      },
      required: ['projectId', 'branch', 'ref'],
    },
  },
  {
    name: 'gitlab_delete_branch',
    description: 'Delete a branch from a GitLab project',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        branchName: { type: 'string', description: 'Branch name to delete' },
      },
      required: ['projectId', 'branchName'],
    },
  },
  // Commit tools
  {
    name: 'gitlab_list_commits',
    description: 'List commits in a GitLab project repository',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        refName: { type: 'string', description: 'Branch or tag name' },
        path: { type: 'string', description: 'File path to filter' },
        since: { type: 'string', description: 'Only commits after this date' },
        until: { type: 'string', description: 'Only commits before this date' },
        withStats: { type: 'boolean', description: 'Include commit stats' },
        perPage: { type: 'number', description: 'Results per page' },
        page: { type: 'number', description: 'Page number' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'gitlab_get_commit',
    description: 'Get details of a specific commit',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        sha: { type: 'string', description: 'Commit SHA' },
      },
      required: ['projectId', 'sha'],
    },
  },
  {
    name: 'gitlab_create_commit',
    description: 'Create a new commit with file changes',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        branch: { type: 'string', description: 'Branch to commit to' },
        commitMessage: { type: 'string', description: 'Commit message' },
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              action: { type: 'string', enum: ['create', 'delete', 'move', 'update', 'chmod'] },
              filePath: { type: 'string' },
              content: { type: 'string' },
              previousPath: { type: 'string' },
              encoding: { type: 'string', enum: ['text', 'base64'] },
            },
            required: ['action', 'filePath'],
          },
          description: 'File actions to perform',
        },
        authorEmail: { type: 'string', description: 'Author email' },
        authorName: { type: 'string', description: 'Author name' },
        startBranch: { type: 'string', description: 'Start branch' },
      },
      required: ['projectId', 'branch', 'commitMessage', 'actions'],
    },
  },
  {
    name: 'gitlab_get_commit_diff',
    description: 'Get the diff of a commit',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        sha: { type: 'string', description: 'Commit SHA' },
      },
      required: ['projectId', 'sha'],
    },
  },
  {
    name: 'gitlab_cherry_pick_commit',
    description: 'Cherry-pick a commit to a branch',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        sha: { type: 'string', description: 'Commit SHA to cherry-pick' },
        branch: { type: 'string', description: 'Target branch' },
      },
      required: ['projectId', 'sha', 'branch'],
    },
  },
  {
    name: 'gitlab_revert_commit',
    description: 'Revert a commit on a branch',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        sha: { type: 'string', description: 'Commit SHA to revert' },
        branch: { type: 'string', description: 'Target branch' },
      },
      required: ['projectId', 'sha', 'branch'],
    },
  },
  // Tag tools
  {
    name: 'gitlab_list_tags',
    description: 'List tags in a GitLab project repository',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        search: { type: 'string', description: 'Search tags by name' },
        orderBy: { type: 'string', description: 'Order by field' },
        sort: { type: 'string', enum: ['asc', 'desc'], description: 'Sort direction' },
        perPage: { type: 'number', description: 'Results per page' },
        page: { type: 'number', description: 'Page number' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'gitlab_get_tag',
    description: 'Get details of a specific tag',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        tagName: { type: 'string', description: 'Tag name' },
      },
      required: ['projectId', 'tagName'],
    },
  },
  {
    name: 'gitlab_create_tag',
    description: 'Create a new tag in a GitLab project',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        tagName: { type: 'string', description: 'Tag name' },
        ref: { type: 'string', description: 'Source commit SHA or branch' },
        message: { type: 'string', description: 'Tag message (creates annotated tag)' },
      },
      required: ['projectId', 'tagName', 'ref'],
    },
  },
  {
    name: 'gitlab_delete_tag',
    description: 'Delete a tag from a GitLab project',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        tagName: { type: 'string', description: 'Tag name to delete' },
      },
      required: ['projectId', 'tagName'],
    },
  },
  // Tree and compare tools
  {
    name: 'gitlab_get_repository_tree',
    description: 'Get repository file tree',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        path: { type: 'string', description: 'Path inside repository' },
        ref: { type: 'string', description: 'Branch or tag name' },
        recursive: { type: 'boolean', description: 'Get tree recursively' },
        perPage: { type: 'number', description: 'Results per page' },
        page: { type: 'number', description: 'Page number' },
      },
      required: ['projectId'],
    },
  },
  {
    name: 'gitlab_compare_refs',
    description: 'Compare two branches, tags, or commits',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        from: { type: 'string', description: 'Source branch/commit' },
        to: { type: 'string', description: 'Target branch/commit' },
      },
      required: ['projectId', 'from', 'to'],
    },
  },
  // File tools
  {
    name: 'gitlab_get_file',
    description: 'Get file metadata and content from repository',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        filePath: { type: 'string', description: 'File path' },
        ref: { type: 'string', description: 'Branch, tag, or commit' },
      },
      required: ['projectId', 'filePath', 'ref'],
    },
  },
  {
    name: 'gitlab_get_file_raw',
    description: 'Get raw file content from repository',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        filePath: { type: 'string', description: 'File path' },
        ref: { type: 'string', description: 'Branch, tag, or commit' },
      },
      required: ['projectId', 'filePath', 'ref'],
    },
  },
  {
    name: 'gitlab_create_file',
    description: 'Create a new file in the repository',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        filePath: { type: 'string', description: 'File path' },
        branch: { type: 'string', description: 'Branch to create file in' },
        content: { type: 'string', description: 'File content' },
        commitMessage: { type: 'string', description: 'Commit message' },
        authorEmail: { type: 'string', description: 'Author email' },
        authorName: { type: 'string', description: 'Author name' },
        encoding: { type: 'string', enum: ['text', 'base64'], description: 'Content encoding' },
      },
      required: ['projectId', 'filePath', 'branch', 'content', 'commitMessage'],
    },
  },
  {
    name: 'gitlab_update_file',
    description: 'Update an existing file in the repository',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        filePath: { type: 'string', description: 'File path' },
        branch: { type: 'string', description: 'Branch to update file in' },
        content: { type: 'string', description: 'New file content' },
        commitMessage: { type: 'string', description: 'Commit message' },
        authorEmail: { type: 'string', description: 'Author email' },
        authorName: { type: 'string', description: 'Author name' },
        encoding: { type: 'string', enum: ['text', 'base64'], description: 'Content encoding' },
        lastCommitId: { type: 'string', description: 'Last known commit ID' },
      },
      required: ['projectId', 'filePath', 'branch', 'content', 'commitMessage'],
    },
  },
  {
    name: 'gitlab_delete_file',
    description: 'Delete a file from the repository',
    inputSchema: {
      type: 'object' as const,
      properties: {
        projectId: { type: 'string', description: 'Project ID or URL-encoded path' },
        filePath: { type: 'string', description: 'File path' },
        branch: { type: 'string', description: 'Branch to delete file from' },
        commitMessage: { type: 'string', description: 'Commit message' },
        authorEmail: { type: 'string', description: 'Author email' },
        authorName: { type: 'string', description: 'Author name' },
      },
      required: ['projectId', 'filePath', 'branch', 'commitMessage'],
    },
  },
];

// =============================================================================
// Tool Handlers
// =============================================================================

export async function handleRepositoryTool(
  toolName: string,
  args: Record<string, unknown>,
  client: GitLabClient
): Promise<string> {
  switch (toolName) {
    // Branch handlers
    case 'gitlab_list_branches': {
      const { projectId, ...params } = ListBranchesSchema.parse(args);
      const response = await client.listBranches(projectId, params);
      return formatBranchesListAsMarkdown(response);
    }

    case 'gitlab_get_branch': {
      const { projectId, branchName } = GetBranchSchema.parse(args);
      const branch = await client.getBranch(projectId, branchName);
      return formatBranchAsMarkdown(branch);
    }

    case 'gitlab_create_branch': {
      const { projectId, branch, ref } = CreateBranchSchema.parse(args);
      const newBranch = await client.createBranch(projectId, { branch, ref });
      return `Branch created successfully:\n\n${formatBranchAsMarkdown(newBranch)}`;
    }

    case 'gitlab_delete_branch': {
      const { projectId, branchName } = DeleteBranchSchema.parse(args);
      await client.deleteBranch(projectId, branchName);
      return `Branch '${branchName}' deleted successfully.`;
    }

    // Commit handlers
    case 'gitlab_list_commits': {
      const { projectId, ...params } = ListCommitsSchema.parse(args);
      const response = await client.listCommits(projectId, params);
      return formatCommitsListAsMarkdown(response);
    }

    case 'gitlab_get_commit': {
      const { projectId, sha } = GetCommitSchema.parse(args);
      const commit = await client.getCommit(projectId, sha);
      return formatCommitAsMarkdown(commit);
    }

    case 'gitlab_create_commit': {
      const { projectId, ...params } = CreateCommitSchema.parse(args);
      const commit = await client.createCommit(projectId, {
        branch: params.branch,
        commit_message: params.commitMessage,
        actions: params.actions.map(a => ({
          action: a.action,
          file_path: a.filePath,
          content: a.content,
          previous_path: a.previousPath,
          encoding: a.encoding,
        })),
        author_email: params.authorEmail,
        author_name: params.authorName,
        start_branch: params.startBranch,
      });
      return `Commit created successfully:\n\n${formatCommitAsMarkdown(commit)}`;
    }

    case 'gitlab_get_commit_diff': {
      const { projectId, sha } = GetCommitDiffSchema.parse(args);
      const diffs = await client.getCommitDiff(projectId, sha);
      return formatDiffAsMarkdown(diffs);
    }

    case 'gitlab_cherry_pick_commit': {
      const { projectId, sha, branch } = CherryPickCommitSchema.parse(args);
      const commit = await client.cherryPickCommit(projectId, sha, branch);
      return `Commit cherry-picked successfully:\n\n${formatCommitAsMarkdown(commit)}`;
    }

    case 'gitlab_revert_commit': {
      const { projectId, sha, branch } = RevertCommitSchema.parse(args);
      const commit = await client.revertCommit(projectId, sha, branch);
      return `Commit reverted successfully:\n\n${formatCommitAsMarkdown(commit)}`;
    }

    // Tag handlers
    case 'gitlab_list_tags': {
      const { projectId, ...params } = ListTagsSchema.parse(args);
      const response = await client.listTags(projectId, params);
      return formatTagsListAsMarkdown(response);
    }

    case 'gitlab_get_tag': {
      const { projectId, tagName } = GetTagSchema.parse(args);
      const tag = await client.getTag(projectId, tagName);
      return formatTagAsMarkdown(tag);
    }

    case 'gitlab_create_tag': {
      const { projectId, tagName, ref, message } = CreateTagSchema.parse(args);
      const tag = await client.createTag(projectId, { tag_name: tagName, ref, message });
      return `Tag created successfully:\n\n${formatTagAsMarkdown(tag)}`;
    }

    case 'gitlab_delete_tag': {
      const { projectId, tagName } = DeleteTagSchema.parse(args);
      await client.deleteTag(projectId, tagName);
      return `Tag '${tagName}' deleted successfully.`;
    }

    // Tree and compare handlers
    case 'gitlab_get_repository_tree': {
      const { projectId, ...params } = GetTreeSchema.parse(args);
      const response = await client.getRepositoryTree(projectId, params);
      return formatTreeAsMarkdown(response.items);
    }

    case 'gitlab_compare_refs': {
      const { projectId, from, to } = CompareRefsSchema.parse(args);
      const compare = await client.compareRefs(projectId, from, to);
      return formatCompareAsMarkdown(compare);
    }

    // File handlers
    case 'gitlab_get_file': {
      const { projectId, filePath, ref } = GetFileSchema.parse(args);
      const file = await client.getFile(projectId, filePath, ref);
      return formatFileAsMarkdown(file);
    }

    case 'gitlab_get_file_raw': {
      const { projectId, filePath, ref } = GetFileRawSchema.parse(args);
      const content = await client.getFileRaw(projectId, filePath, ref);
      return `# File: ${filePath}\n\n\`\`\`\n${content}\n\`\`\``;
    }

    case 'gitlab_create_file': {
      const { projectId, filePath, ...params } = CreateFileSchema.parse(args);
      await client.createFile(projectId, filePath, {
        branch: params.branch,
        content: params.content,
        commit_message: params.commitMessage,
        author_email: params.authorEmail,
        author_name: params.authorName,
        encoding: params.encoding,
      });
      return `File '${filePath}' created successfully.`;
    }

    case 'gitlab_update_file': {
      const { projectId, filePath, ...params } = UpdateFileSchema.parse(args);
      await client.updateFile(projectId, filePath, {
        branch: params.branch,
        content: params.content,
        commit_message: params.commitMessage,
        author_email: params.authorEmail,
        author_name: params.authorName,
        encoding: params.encoding,
        last_commit_id: params.lastCommitId,
      });
      return `File '${filePath}' updated successfully.`;
    }

    case 'gitlab_delete_file': {
      const { projectId, filePath, ...params } = DeleteFileSchema.parse(args);
      await client.deleteFile(projectId, filePath, {
        branch: params.branch,
        commit_message: params.commitMessage,
        author_email: params.authorEmail,
        author_name: params.authorName,
      });
      return `File '${filePath}' deleted successfully.`;
    }

    default:
      throw new Error(`Unknown repository tool: ${toolName}`);
  }
}
