/**
 * GitLab Response Formatting Utilities
 *
 * Helpers for formatting GitLab API responses as Markdown.
 */

import type {
  GitLabProject,
  GitLabBranch,
  GitLabCommit,
  GitLabTag,
  GitLabMergeRequest,
  GitLabIssue,
  GitLabPipeline,
  GitLabJob,
  GitLabGroup,
  GitLabUser,
  GitLabNote,
  GitLabLabel,
  GitLabRelease,
  GitLabFile,
  GitLabTreeItem,
  GitLabDiff,
  GitLabCompare,
  GitLabMember,
  GitLabVariable,
  PaginatedResponse,
} from '../types/entities.js';
import { GitLabApiError, formatErrorForLogging } from './errors.js';

/**
 * MCP tool response type
 */
export interface ToolResponse {
  [key: string]: unknown;
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

/**
 * Format an error response
 */
export function formatError(error: unknown): ToolResponse {
  const errorInfo = formatErrorForLogging(error);

  let message: string;
  if (error instanceof GitLabApiError) {
    message = `Error: ${error.message}`;
    if (error.retryable) {
      message += ' (retryable)';
    }
  } else if (error instanceof Error) {
    message = `Error: ${error.message}`;
  } else {
    message = `Error: ${String(error)}`;
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ error: message, details: errorInfo }, null, 2),
      },
    ],
    isError: true,
  };
}

// =============================================================================
// Pagination Helpers
// =============================================================================

function formatPaginationInfo(response: PaginatedResponse<unknown>): string {
  const lines: string[] = [];

  if (response.total !== undefined) {
    lines.push(`**Total:** ${response.total} | **Page:** ${response.page || 1}/${response.totalPages || 1}`);
  }

  if (response.hasMore && response.nextPage) {
    lines.push(`**Next Page:** ${response.nextPage}`);
  }

  return lines.join('\n');
}

// =============================================================================
// Project Formatters
// =============================================================================

export function formatProjectAsMarkdown(project: GitLabProject): string {
  const lines: string[] = [];

  lines.push(`# ${project.name}`);
  lines.push('');

  if (project.description) {
    lines.push(project.description);
    lines.push('');
  }

  lines.push(`**ID:** ${project.id}`);
  lines.push(`**Path:** ${project.path_with_namespace}`);
  lines.push(`**Visibility:** ${project.visibility}`);
  lines.push(`**Default Branch:** ${project.default_branch || 'N/A'}`);

  if (project.web_url) {
    lines.push(`**URL:** ${project.web_url}`);
  }

  if (project.ssh_url_to_repo) {
    lines.push(`**SSH:** ${project.ssh_url_to_repo}`);
  }

  if (project.http_url_to_repo) {
    lines.push(`**HTTP:** ${project.http_url_to_repo}`);
  }

  lines.push('');
  lines.push('## Stats');
  lines.push(`- Stars: ${project.star_count || 0}`);
  lines.push(`- Forks: ${project.forks_count || 0}`);
  lines.push(`- Open Issues: ${project.open_issues_count || 0}`);

  if (project.topics && project.topics.length > 0) {
    lines.push('');
    lines.push(`**Topics:** ${project.topics.join(', ')}`);
  }

  lines.push('');
  lines.push(`**Created:** ${project.created_at}`);
  lines.push(`**Last Activity:** ${project.last_activity_at}`);

  return lines.join('\n');
}

export function formatProjectsListAsMarkdown(response: PaginatedResponse<GitLabProject>): string {
  const lines: string[] = [];

  lines.push('# Projects');
  lines.push('');
  lines.push(formatPaginationInfo(response));
  lines.push('');

  if (response.items.length === 0) {
    lines.push('_No projects found._');
    return lines.join('\n');
  }

  lines.push('| ID | Name | Path | Visibility | Stars |');
  lines.push('|---|---|---|---|---|');

  for (const project of response.items) {
    lines.push(
      `| ${project.id} | ${project.name} | ${project.path_with_namespace} | ${project.visibility} | ${project.star_count || 0} |`
    );
  }

  return lines.join('\n');
}

// =============================================================================
// Branch Formatters
// =============================================================================

export function formatBranchAsMarkdown(branch: GitLabBranch): string {
  const lines: string[] = [];

  lines.push(`# Branch: ${branch.name}`);
  lines.push('');
  lines.push(`**Protected:** ${branch.protected ? 'Yes' : 'No'}`);
  lines.push(`**Default:** ${branch.default ? 'Yes' : 'No'}`);
  lines.push(`**Merged:** ${branch.merged ? 'Yes' : 'No'}`);
  lines.push(`**Can Push:** ${branch.can_push ? 'Yes' : 'No'}`);

  if (branch.commit) {
    lines.push('');
    lines.push('## Latest Commit');
    lines.push(`**SHA:** \`${branch.commit.id}\``);
    lines.push(`**Message:** ${branch.commit.message?.split('\n')[0] || 'N/A'}`);
    lines.push(`**Author:** ${branch.commit.author_name}`);
    lines.push(`**Date:** ${branch.commit.created_at}`);
  }

  return lines.join('\n');
}

export function formatBranchesListAsMarkdown(response: PaginatedResponse<GitLabBranch>): string {
  const lines: string[] = [];

  lines.push('# Branches');
  lines.push('');
  lines.push(formatPaginationInfo(response));
  lines.push('');

  if (response.items.length === 0) {
    lines.push('_No branches found._');
    return lines.join('\n');
  }

  lines.push('| Name | Protected | Default | Merged |');
  lines.push('|---|---|---|---|');

  for (const branch of response.items) {
    lines.push(
      `| ${branch.name} | ${branch.protected ? 'Yes' : 'No'} | ${branch.default ? 'Yes' : 'No'} | ${branch.merged ? 'Yes' : 'No'} |`
    );
  }

  return lines.join('\n');
}

// =============================================================================
// Commit Formatters
// =============================================================================

export function formatCommitAsMarkdown(commit: GitLabCommit): string {
  const lines: string[] = [];

  lines.push(`# Commit: ${commit.short_id || commit.id.substring(0, 8)}`);
  lines.push('');
  lines.push(`**SHA:** \`${commit.id}\``);
  lines.push(`**Message:**`);
  lines.push('```');
  lines.push(commit.message || 'No message');
  lines.push('```');
  lines.push('');
  lines.push(`**Author:** ${commit.author_name} <${commit.author_email}>`);
  lines.push(`**Date:** ${commit.created_at}`);

  if (commit.committer_name && commit.committer_name !== commit.author_name) {
    lines.push(`**Committer:** ${commit.committer_name} <${commit.committer_email}>`);
  }

  if (commit.parent_ids && commit.parent_ids.length > 0) {
    lines.push(`**Parents:** ${commit.parent_ids.map(p => `\`${p.substring(0, 8)}\``).join(', ')}`);
  }

  if (commit.stats) {
    lines.push('');
    lines.push('## Stats');
    lines.push(`- Additions: ${commit.stats.additions}`);
    lines.push(`- Deletions: ${commit.stats.deletions}`);
    lines.push(`- Total: ${commit.stats.total}`);
  }

  return lines.join('\n');
}

export function formatCommitsListAsMarkdown(response: PaginatedResponse<GitLabCommit>): string {
  const lines: string[] = [];

  lines.push('# Commits');
  lines.push('');
  lines.push(formatPaginationInfo(response));
  lines.push('');

  if (response.items.length === 0) {
    lines.push('_No commits found._');
    return lines.join('\n');
  }

  for (const commit of response.items) {
    const shortId = commit.short_id || commit.id.substring(0, 8);
    const message = commit.message?.split('\n')[0] || 'No message';
    lines.push(`- **\`${shortId}\`** ${message} - _${commit.author_name}_ (${commit.created_at})`);
  }

  return lines.join('\n');
}

// =============================================================================
// Tag Formatters
// =============================================================================

export function formatTagAsMarkdown(tag: GitLabTag): string {
  const lines: string[] = [];

  lines.push(`# Tag: ${tag.name}`);
  lines.push('');

  if (tag.message) {
    lines.push(`**Message:** ${tag.message}`);
    lines.push('');
  }

  lines.push(`**Target:** \`${tag.target}\``);
  lines.push(`**Protected:** ${tag.protected ? 'Yes' : 'No'}`);

  if (tag.commit) {
    lines.push('');
    lines.push('## Commit');
    lines.push(`**SHA:** \`${tag.commit.id}\``);
    lines.push(`**Message:** ${tag.commit.message?.split('\n')[0] || 'N/A'}`);
    lines.push(`**Author:** ${tag.commit.author_name}`);
    lines.push(`**Date:** ${tag.commit.created_at}`);
  }

  if (tag.release) {
    lines.push('');
    lines.push('## Release');
    lines.push(`**Name:** ${tag.release.tag_name}`);
    if (tag.release.description) {
      lines.push(`**Description:** ${tag.release.description}`);
    }
  }

  return lines.join('\n');
}

export function formatTagsListAsMarkdown(response: PaginatedResponse<GitLabTag>): string {
  const lines: string[] = [];

  lines.push('# Tags');
  lines.push('');
  lines.push(formatPaginationInfo(response));
  lines.push('');

  if (response.items.length === 0) {
    lines.push('_No tags found._');
    return lines.join('\n');
  }

  lines.push('| Name | Target | Protected | Message |');
  lines.push('|---|---|---|---|');

  for (const tag of response.items) {
    const target = tag.target.substring(0, 8);
    const message = tag.message?.split('\n')[0] || '-';
    lines.push(
      `| ${tag.name} | \`${target}\` | ${tag.protected ? 'Yes' : 'No'} | ${message} |`
    );
  }

  return lines.join('\n');
}

// =============================================================================
// Merge Request Formatters
// =============================================================================

export function formatMergeRequestAsMarkdown(mr: GitLabMergeRequest): string {
  const lines: string[] = [];

  lines.push(`# MR !${mr.iid}: ${mr.title}`);
  lines.push('');

  if (mr.draft) {
    lines.push('> **Draft**');
    lines.push('');
  }

  lines.push(`**State:** ${mr.state}`);
  lines.push(`**Source:** ${mr.source_branch} → **Target:** ${mr.target_branch}`);
  lines.push(`**Author:** ${mr.author?.name || mr.author?.username || 'Unknown'}`);

  if (mr.assignee) {
    lines.push(`**Assignee:** ${mr.assignee.name || mr.assignee.username}`);
  }

  if (mr.reviewers && mr.reviewers.length > 0) {
    const reviewerNames = mr.reviewers.map(r => r.name || r.username).join(', ');
    lines.push(`**Reviewers:** ${reviewerNames}`);
  }

  if (mr.labels && mr.labels.length > 0) {
    lines.push(`**Labels:** ${mr.labels.join(', ')}`);
  }

  if (mr.milestone) {
    lines.push(`**Milestone:** ${mr.milestone.title}`);
  }

  lines.push('');
  lines.push(`**URL:** ${mr.web_url}`);
  lines.push('');

  if (mr.description) {
    lines.push('## Description');
    lines.push(mr.description);
    lines.push('');
  }

  lines.push('## Stats');
  lines.push(`- Changes: +${mr.changes_count || 0}`);
  lines.push(`- Merge Status: ${mr.merge_status || 'unknown'}`);
  if (mr.has_conflicts !== undefined) {
    lines.push(`- Has Conflicts: ${mr.has_conflicts ? 'Yes' : 'No'}`);
  }

  lines.push('');
  lines.push(`**Created:** ${mr.created_at}`);
  lines.push(`**Updated:** ${mr.updated_at}`);
  if (mr.merged_at) {
    lines.push(`**Merged:** ${mr.merged_at}`);
  }

  return lines.join('\n');
}

export function formatMergeRequestsListAsMarkdown(response: PaginatedResponse<GitLabMergeRequest>): string {
  const lines: string[] = [];

  lines.push('# Merge Requests');
  lines.push('');
  lines.push(formatPaginationInfo(response));
  lines.push('');

  if (response.items.length === 0) {
    lines.push('_No merge requests found._');
    return lines.join('\n');
  }

  lines.push('| IID | Title | State | Author | Source → Target |');
  lines.push('|---|---|---|---|---|');

  for (const mr of response.items) {
    const author = mr.author?.username || 'Unknown';
    const title = mr.draft ? `[Draft] ${mr.title}` : mr.title;
    lines.push(
      `| !${mr.iid} | ${title} | ${mr.state} | ${author} | ${mr.source_branch} → ${mr.target_branch} |`
    );
  }

  return lines.join('\n');
}

// =============================================================================
// Issue Formatters
// =============================================================================

export function formatIssueAsMarkdown(issue: GitLabIssue): string {
  const lines: string[] = [];

  lines.push(`# Issue #${issue.iid}: ${issue.title}`);
  lines.push('');

  if (issue.confidential) {
    lines.push('> **Confidential**');
    lines.push('');
  }

  lines.push(`**State:** ${issue.state}`);
  lines.push(`**Author:** ${issue.author?.name || issue.author?.username || 'Unknown'}`);

  if (issue.assignee) {
    lines.push(`**Assignee:** ${issue.assignee.name || issue.assignee.username}`);
  } else if (issue.assignees && issue.assignees.length > 0) {
    const assigneeNames = issue.assignees.map(a => a.name || a.username).join(', ');
    lines.push(`**Assignees:** ${assigneeNames}`);
  }

  if (issue.labels && issue.labels.length > 0) {
    lines.push(`**Labels:** ${issue.labels.join(', ')}`);
  }

  if (issue.milestone) {
    lines.push(`**Milestone:** ${issue.milestone.title}`);
  }

  if (issue.due_date) {
    lines.push(`**Due Date:** ${issue.due_date}`);
  }

  if (issue.weight !== undefined) {
    lines.push(`**Weight:** ${issue.weight}`);
  }

  lines.push('');
  lines.push(`**URL:** ${issue.web_url}`);
  lines.push('');

  if (issue.description) {
    lines.push('## Description');
    lines.push(issue.description);
    lines.push('');
  }

  lines.push(`**Created:** ${issue.created_at}`);
  lines.push(`**Updated:** ${issue.updated_at}`);
  if (issue.closed_at) {
    lines.push(`**Closed:** ${issue.closed_at}`);
  }

  return lines.join('\n');
}

export function formatIssuesListAsMarkdown(response: PaginatedResponse<GitLabIssue>): string {
  const lines: string[] = [];

  lines.push('# Issues');
  lines.push('');
  lines.push(formatPaginationInfo(response));
  lines.push('');

  if (response.items.length === 0) {
    lines.push('_No issues found._');
    return lines.join('\n');
  }

  lines.push('| IID | Title | State | Author | Labels |');
  lines.push('|---|---|---|---|---|');

  for (const issue of response.items) {
    const author = issue.author?.username || 'Unknown';
    const labels = issue.labels?.join(', ') || '-';
    const title = issue.confidential ? `[Confidential] ${issue.title}` : issue.title;
    lines.push(
      `| #${issue.iid} | ${title} | ${issue.state} | ${author} | ${labels} |`
    );
  }

  return lines.join('\n');
}

// =============================================================================
// Pipeline Formatters
// =============================================================================

export function formatPipelineAsMarkdown(pipeline: GitLabPipeline): string {
  const lines: string[] = [];

  lines.push(`# Pipeline #${pipeline.id}`);
  lines.push('');
  lines.push(`**Status:** ${pipeline.status}`);
  lines.push(`**Ref:** ${pipeline.ref}`);
  lines.push(`**SHA:** \`${pipeline.sha}\``);

  if (pipeline.source) {
    lines.push(`**Source:** ${pipeline.source}`);
  }

  if (pipeline.user) {
    lines.push(`**Triggered by:** ${pipeline.user.name || pipeline.user.username}`);
  }

  if (pipeline.web_url) {
    lines.push('');
    lines.push(`**URL:** ${pipeline.web_url}`);
  }

  lines.push('');
  lines.push(`**Created:** ${pipeline.created_at}`);
  if (pipeline.started_at) {
    lines.push(`**Started:** ${pipeline.started_at}`);
  }
  if (pipeline.finished_at) {
    lines.push(`**Finished:** ${pipeline.finished_at}`);
  }
  if (pipeline.duration) {
    lines.push(`**Duration:** ${pipeline.duration}s`);
  }

  return lines.join('\n');
}

export function formatPipelinesListAsMarkdown(response: PaginatedResponse<GitLabPipeline>): string {
  const lines: string[] = [];

  lines.push('# Pipelines');
  lines.push('');
  lines.push(formatPaginationInfo(response));
  lines.push('');

  if (response.items.length === 0) {
    lines.push('_No pipelines found._');
    return lines.join('\n');
  }

  lines.push('| ID | Status | Ref | SHA | Source | Duration |');
  lines.push('|---|---|---|---|---|---|');

  for (const pipeline of response.items) {
    const sha = pipeline.sha.substring(0, 8);
    const duration = pipeline.duration ? `${pipeline.duration}s` : '-';
    lines.push(
      `| ${pipeline.id} | ${pipeline.status} | ${pipeline.ref} | \`${sha}\` | ${pipeline.source || '-'} | ${duration} |`
    );
  }

  return lines.join('\n');
}

// =============================================================================
// Job Formatters
// =============================================================================

export function formatJobAsMarkdown(job: GitLabJob): string {
  const lines: string[] = [];

  lines.push(`# Job: ${job.name} (#${job.id})`);
  lines.push('');
  lines.push(`**Status:** ${job.status}`);
  lines.push(`**Stage:** ${job.stage}`);
  lines.push(`**Ref:** ${job.ref}`);

  if (job.tag !== undefined) {
    lines.push(`**Is Tag:** ${job.tag ? 'Yes' : 'No'}`);
  }

  if (job.allow_failure) {
    lines.push(`**Allow Failure:** Yes`);
  }

  if (job.user) {
    lines.push(`**Triggered by:** ${job.user.name || job.user.username}`);
  }

  if (job.pipeline) {
    lines.push(`**Pipeline:** #${job.pipeline.id}`);
  }

  if (job.web_url) {
    lines.push('');
    lines.push(`**URL:** ${job.web_url}`);
  }

  lines.push('');
  lines.push(`**Created:** ${job.created_at}`);
  if (job.started_at) {
    lines.push(`**Started:** ${job.started_at}`);
  }
  if (job.finished_at) {
    lines.push(`**Finished:** ${job.finished_at}`);
  }
  if (job.duration) {
    lines.push(`**Duration:** ${job.duration}s`);
  }

  if (job.runner) {
    lines.push('');
    lines.push('## Runner');
    lines.push(`- ID: ${job.runner.id}`);
    if (job.runner.description) {
      lines.push(`- Description: ${job.runner.description}`);
    }
  }

  return lines.join('\n');
}

export function formatJobsListAsMarkdown(response: PaginatedResponse<GitLabJob>): string {
  const lines: string[] = [];

  lines.push('# Jobs');
  lines.push('');
  lines.push(formatPaginationInfo(response));
  lines.push('');

  if (response.items.length === 0) {
    lines.push('_No jobs found._');
    return lines.join('\n');
  }

  lines.push('| ID | Name | Stage | Status | Duration |');
  lines.push('|---|---|---|---|---|');

  for (const job of response.items) {
    const duration = job.duration ? `${job.duration}s` : '-';
    lines.push(
      `| ${job.id} | ${job.name} | ${job.stage} | ${job.status} | ${duration} |`
    );
  }

  return lines.join('\n');
}

// =============================================================================
// Group Formatters
// =============================================================================

export function formatGroupAsMarkdown(group: GitLabGroup): string {
  const lines: string[] = [];

  lines.push(`# ${group.name}`);
  lines.push('');

  if (group.description) {
    lines.push(group.description);
    lines.push('');
  }

  lines.push(`**ID:** ${group.id}`);
  lines.push(`**Path:** ${group.full_path}`);
  lines.push(`**Visibility:** ${group.visibility}`);

  if (group.web_url) {
    lines.push(`**URL:** ${group.web_url}`);
  }

  if (group.parent_id) {
    lines.push(`**Parent ID:** ${group.parent_id}`);
  }

  lines.push('');
  lines.push(`**Created:** ${group.created_at}`);

  return lines.join('\n');
}

export function formatGroupsListAsMarkdown(response: PaginatedResponse<GitLabGroup>): string {
  const lines: string[] = [];

  lines.push('# Groups');
  lines.push('');
  lines.push(formatPaginationInfo(response));
  lines.push('');

  if (response.items.length === 0) {
    lines.push('_No groups found._');
    return lines.join('\n');
  }

  lines.push('| ID | Name | Path | Visibility |');
  lines.push('|---|---|---|---|');

  for (const group of response.items) {
    lines.push(
      `| ${group.id} | ${group.name} | ${group.full_path} | ${group.visibility} |`
    );
  }

  return lines.join('\n');
}

// =============================================================================
// User Formatters
// =============================================================================

export function formatUserAsMarkdown(user: GitLabUser): string {
  const lines: string[] = [];

  lines.push(`# ${user.name}`);
  lines.push('');
  lines.push(`**Username:** @${user.username}`);
  lines.push(`**ID:** ${user.id}`);
  lines.push(`**State:** ${user.state}`);

  if (user.email) {
    lines.push(`**Email:** ${user.email}`);
  }

  if (user.web_url) {
    lines.push(`**Profile:** ${user.web_url}`);
  }

  if (user.avatar_url) {
    lines.push(`**Avatar:** ${user.avatar_url}`);
  }

  if (user.bio) {
    lines.push('');
    lines.push('## Bio');
    lines.push(user.bio);
  }

  if (user.location) {
    lines.push(`**Location:** ${user.location}`);
  }

  if (user.created_at) {
    lines.push('');
    lines.push(`**Created:** ${user.created_at}`);
  }

  return lines.join('\n');
}

export function formatUsersListAsMarkdown(response: PaginatedResponse<GitLabUser>): string {
  const lines: string[] = [];

  lines.push('# Users');
  lines.push('');
  lines.push(formatPaginationInfo(response));
  lines.push('');

  if (response.items.length === 0) {
    lines.push('_No users found._');
    return lines.join('\n');
  }

  lines.push('| ID | Username | Name | State |');
  lines.push('|---|---|---|---|');

  for (const user of response.items) {
    lines.push(
      `| ${user.id} | @${user.username} | ${user.name} | ${user.state} |`
    );
  }

  return lines.join('\n');
}

// =============================================================================
// Note Formatters
// =============================================================================

export function formatNoteAsMarkdown(note: GitLabNote): string {
  const lines: string[] = [];

  lines.push(`## Note #${note.id}`);
  lines.push('');
  lines.push(`**Author:** ${note.author?.name || note.author?.username || 'Unknown'}`);
  lines.push(`**Created:** ${note.created_at}`);

  if (note.updated_at !== note.created_at) {
    lines.push(`**Updated:** ${note.updated_at}`);
  }

  if (note.system) {
    lines.push(`**Type:** System Note`);
  }

  if (note.internal) {
    lines.push(`**Internal:** Yes`);
  }

  lines.push('');
  lines.push(note.body);

  return lines.join('\n');
}

export function formatNotesListAsMarkdown(response: PaginatedResponse<GitLabNote>): string {
  const lines: string[] = [];

  lines.push('# Notes');
  lines.push('');
  lines.push(formatPaginationInfo(response));
  lines.push('');

  if (response.items.length === 0) {
    lines.push('_No notes found._');
    return lines.join('\n');
  }

  for (const note of response.items) {
    lines.push('---');
    lines.push(formatNoteAsMarkdown(note));
    lines.push('');
  }

  return lines.join('\n');
}

// =============================================================================
// Repository Formatters
// =============================================================================

export function formatFileAsMarkdown(file: GitLabFile): string {
  const lines: string[] = [];

  lines.push(`# File: ${file.file_name}`);
  lines.push('');
  lines.push(`**Path:** ${file.file_path}`);
  lines.push(`**Size:** ${file.size} bytes`);
  lines.push(`**Encoding:** ${file.encoding}`);
  lines.push(`**Ref:** ${file.ref}`);
  lines.push(`**Blob ID:** \`${file.blob_id}\``);
  lines.push(`**Commit ID:** \`${file.commit_id}\``);
  lines.push(`**Last Commit ID:** \`${file.last_commit_id}\``);

  if (file.content) {
    lines.push('');
    lines.push('## Content');
    lines.push('```');
    // Decode base64 content if needed
    if (file.encoding === 'base64') {
      try {
        lines.push(atob(file.content));
      } catch {
        lines.push(file.content);
      }
    } else {
      lines.push(file.content);
    }
    lines.push('```');
  }

  return lines.join('\n');
}

export function formatTreeAsMarkdown(items: GitLabTreeItem[]): string {
  const lines: string[] = [];

  lines.push('# Repository Tree');
  lines.push('');

  if (items.length === 0) {
    lines.push('_No items found._');
    return lines.join('\n');
  }

  // Group by type
  const trees = items.filter(i => i.type === 'tree');
  const blobs = items.filter(i => i.type === 'blob');

  if (trees.length > 0) {
    lines.push('## Directories');
    for (const item of trees) {
      lines.push(`- 📁 ${item.name}/`);
    }
    lines.push('');
  }

  if (blobs.length > 0) {
    lines.push('## Files');
    for (const item of blobs) {
      lines.push(`- 📄 ${item.name}`);
    }
  }

  return lines.join('\n');
}

export function formatDiffAsMarkdown(diffs: GitLabDiff[]): string {
  const lines: string[] = [];

  lines.push('# Diff');
  lines.push('');

  if (diffs.length === 0) {
    lines.push('_No changes._');
    return lines.join('\n');
  }

  for (const diff of diffs) {
    lines.push(`## ${diff.new_path}`);

    if (diff.new_file) {
      lines.push('> New file');
    } else if (diff.deleted_file) {
      lines.push('> Deleted file');
    } else if (diff.renamed_file) {
      lines.push(`> Renamed from: ${diff.old_path}`);
    }

    if (diff.diff) {
      lines.push('');
      lines.push('```diff');
      lines.push(diff.diff);
      lines.push('```');
    }

    lines.push('');
  }

  return lines.join('\n');
}

export function formatCompareAsMarkdown(compare: GitLabCompare): string {
  const lines: string[] = [];

  lines.push('# Compare');
  lines.push('');
  lines.push(`**From:** ${compare.compare_timeout ? 'Timeout' : 'Complete'}`);
  lines.push(`**Same:** ${compare.compare_same_ref ? 'Yes' : 'No'}`);

  if (compare.commits && compare.commits.length > 0) {
    lines.push('');
    lines.push('## Commits');
    for (const commit of compare.commits) {
      const shortId = commit.short_id || commit.id.substring(0, 8);
      const message = commit.message?.split('\n')[0] || 'No message';
      lines.push(`- **\`${shortId}\`** ${message}`);
    }
  }

  if (compare.diffs && compare.diffs.length > 0) {
    lines.push('');
    lines.push('## Files Changed');
    for (const diff of compare.diffs) {
      let status = '';
      if (diff.new_file) status = '[new]';
      else if (diff.deleted_file) status = '[deleted]';
      else if (diff.renamed_file) status = '[renamed]';
      lines.push(`- ${diff.new_path} ${status}`);
    }
  }

  return lines.join('\n');
}

// =============================================================================
// Label Formatters
// =============================================================================

export function formatLabelAsMarkdown(label: GitLabLabel): string {
  const lines: string[] = [];

  lines.push(`# Label: ${label.name}`);
  lines.push('');
  lines.push(`**ID:** ${label.id}`);
  lines.push(`**Color:** ${label.color}`);

  if (label.description) {
    lines.push(`**Description:** ${label.description}`);
  }

  if (label.priority !== undefined) {
    lines.push(`**Priority:** ${label.priority}`);
  }

  return lines.join('\n');
}

export function formatLabelsListAsMarkdown(response: PaginatedResponse<GitLabLabel>): string {
  const lines: string[] = [];

  lines.push('# Labels');
  lines.push('');
  lines.push(formatPaginationInfo(response));
  lines.push('');

  if (response.items.length === 0) {
    lines.push('_No labels found._');
    return lines.join('\n');
  }

  lines.push('| ID | Name | Color | Description |');
  lines.push('|---|---|---|---|');

  for (const label of response.items) {
    lines.push(
      `| ${label.id} | ${label.name} | ${label.color} | ${label.description || '-'} |`
    );
  }

  return lines.join('\n');
}

// =============================================================================
// Release Formatters
// =============================================================================

export function formatReleaseAsMarkdown(release: GitLabRelease): string {
  const lines: string[] = [];

  lines.push(`# Release: ${release.name}`);
  lines.push('');
  lines.push(`**Tag:** ${release.tag_name}`);

  if (release.description) {
    lines.push('');
    lines.push('## Description');
    lines.push(release.description);
  }

  if (release.author) {
    lines.push('');
    lines.push(`**Author:** ${release.author.name || release.author.username}`);
  }

  lines.push('');
  lines.push(`**Created:** ${release.created_at}`);
  if (release.released_at) {
    lines.push(`**Released:** ${release.released_at}`);
  }

  if (release.assets && release.assets.links && release.assets.links.length > 0) {
    lines.push('');
    lines.push('## Assets');
    for (const link of release.assets.links) {
      lines.push(`- [${link.name}](${link.url})`);
    }
  }

  return lines.join('\n');
}

export function formatReleasesListAsMarkdown(response: PaginatedResponse<GitLabRelease>): string {
  const lines: string[] = [];

  lines.push('# Releases');
  lines.push('');
  lines.push(formatPaginationInfo(response));
  lines.push('');

  if (response.items.length === 0) {
    lines.push('_No releases found._');
    return lines.join('\n');
  }

  lines.push('| Tag | Name | Created | Released |');
  lines.push('|---|---|---|---|');

  for (const release of response.items) {
    lines.push(
      `| ${release.tag_name} | ${release.name} | ${release.created_at} | ${release.released_at || '-'} |`
    );
  }

  return lines.join('\n');
}

// =============================================================================
// Member Formatters
// =============================================================================

export function formatMemberAsMarkdown(member: GitLabMember): string {
  const lines: string[] = [];

  lines.push(`# Member: ${member.name}`);
  lines.push('');
  lines.push(`**Username:** @${member.username}`);
  lines.push(`**ID:** ${member.id}`);
  lines.push(`**Access Level:** ${member.access_level}`);
  lines.push(`**State:** ${member.state}`);

  if (member.web_url) {
    lines.push(`**Profile:** ${member.web_url}`);
  }

  if (member.expires_at) {
    lines.push(`**Expires:** ${member.expires_at}`);
  }

  return lines.join('\n');
}

export function formatMembersListAsMarkdown(response: PaginatedResponse<GitLabMember>): string {
  const lines: string[] = [];

  lines.push('# Members');
  lines.push('');
  lines.push(formatPaginationInfo(response));
  lines.push('');

  if (response.items.length === 0) {
    lines.push('_No members found._');
    return lines.join('\n');
  }

  lines.push('| ID | Username | Name | Access Level | Expires |');
  lines.push('|---|---|---|---|---|');

  for (const member of response.items) {
    lines.push(
      `| ${member.id} | @${member.username} | ${member.name} | ${member.access_level} | ${member.expires_at || '-'} |`
    );
  }

  return lines.join('\n');
}

// =============================================================================
// Variable Formatters
// =============================================================================

export function formatVariableAsMarkdown(variable: GitLabVariable): string {
  const lines: string[] = [];

  lines.push(`# Variable: ${variable.key}`);
  lines.push('');
  lines.push(`**Value:** ${variable.masked ? '***MASKED***' : variable.value}`);
  lines.push(`**Protected:** ${variable.protected ? 'Yes' : 'No'}`);
  lines.push(`**Masked:** ${variable.masked ? 'Yes' : 'No'}`);
  lines.push(`**Type:** ${variable.variable_type}`);

  if (variable.environment_scope) {
    lines.push(`**Environment Scope:** ${variable.environment_scope}`);
  }

  return lines.join('\n');
}

export function formatVariablesListAsMarkdown(response: PaginatedResponse<GitLabVariable>): string {
  const lines: string[] = [];

  lines.push('# Variables');
  lines.push('');
  lines.push(formatPaginationInfo(response));
  lines.push('');

  if (response.items.length === 0) {
    lines.push('_No variables found._');
    return lines.join('\n');
  }

  lines.push('| Key | Protected | Masked | Type | Scope |');
  lines.push('|---|---|---|---|---|');

  for (const variable of response.items) {
    lines.push(
      `| ${variable.key} | ${variable.protected ? 'Yes' : 'No'} | ${variable.masked ? 'Yes' : 'No'} | ${variable.variable_type} | ${variable.environment_scope || '*'} |`
    );
  }

  return lines.join('\n');
}
