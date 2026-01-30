/**
 * GitLab Entity Types
 *
 * Standard data structures for GitLab entities.
 */

// =============================================================================
// Pagination
// =============================================================================

export interface PaginationParams {
  /** Number of items to return (per_page in GitLab API) */
  perPage?: number;
  /** Page number for offset pagination */
  page?: number;
}

export interface PaginatedResponse<T> {
  /** Array of items */
  items: T[];
  /** Number of items in this response */
  count: number;
  /** Total count (from X-Total header if available) */
  total?: number;
  /** Whether more items are available */
  hasMore: boolean;
  /** Current page number */
  page?: number;
  /** Next page number */
  nextPage?: number;
  /** Total pages */
  totalPages?: number;
}

// =============================================================================
// Common Types
// =============================================================================

export type ResponseFormat = 'json' | 'markdown';

export interface GitLabUser {
  id: number;
  username: string;
  name: string;
  state: string;
  avatar_url?: string;
  web_url: string;
  email?: string;
  bio?: string;
  location?: string;
  created_at?: string;
}

export interface GitLabNamespace {
  id: number;
  name: string;
  path: string;
  kind: 'user' | 'group';
  full_path: string;
  avatar_url?: string;
  web_url: string;
}

// =============================================================================
// Project
// =============================================================================

export interface GitLabProject {
  id: number;
  name: string;
  name_with_namespace: string;
  path: string;
  path_with_namespace: string;
  description?: string;
  visibility: 'private' | 'internal' | 'public';
  default_branch?: string;
  web_url: string;
  ssh_url_to_repo: string;
  http_url_to_repo: string;
  readme_url?: string;
  namespace: GitLabNamespace;
  owner?: GitLabUser;
  created_at: string;
  last_activity_at: string;
  archived: boolean;
  forks_count: number;
  star_count: number;
  open_issues_count?: number;
  topics?: string[];
  avatar_url?: string;
  empty_repo: boolean;
}

export interface ProjectCreateInput {
  name: string;
  path?: string;
  namespace_id?: number;
  description?: string;
  visibility?: 'private' | 'internal' | 'public';
  initialize_with_readme?: boolean;
  default_branch?: string;
}

export interface ProjectUpdateInput {
  name?: string;
  path?: string;
  description?: string;
  visibility?: 'private' | 'internal' | 'public';
  default_branch?: string;
  archived?: boolean;
}

// =============================================================================
// Branch
// =============================================================================

export interface GitLabBranch {
  name: string;
  commit: GitLabCommit;
  merged: boolean;
  protected: boolean;
  developers_can_push: boolean;
  developers_can_merge: boolean;
  can_push: boolean;
  default: boolean;
  web_url: string;
}

export interface BranchCreateInput {
  branch: string;
  ref: string;
}

// =============================================================================
// Commit
// =============================================================================

export interface GitLabCommit {
  id: string;
  short_id: string;
  title: string;
  message: string;
  author_name: string;
  author_email: string;
  authored_date: string;
  committer_name: string;
  committer_email: string;
  committed_date: string;
  created_at: string;
  parent_ids: string[];
  web_url: string;
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
}

export interface CommitCreateInput {
  branch: string;
  commit_message: string;
  actions: CommitAction[];
  author_email?: string;
  author_name?: string;
  start_branch?: string;
}

export interface CommitAction {
  action: 'create' | 'delete' | 'move' | 'update' | 'chmod';
  file_path: string;
  content?: string;
  previous_path?: string;
  encoding?: 'text' | 'base64';
  execute_filemode?: boolean;
}

// =============================================================================
// Tag
// =============================================================================

export interface GitLabTag {
  name: string;
  message?: string;
  target: string;
  commit: GitLabCommit;
  release?: {
    tag_name: string;
    description: string;
  };
  protected: boolean;
}

export interface TagCreateInput {
  tag_name: string;
  ref: string;
  message?: string;
  release_description?: string;
}

// =============================================================================
// Merge Request
// =============================================================================

export interface GitLabMergeRequest {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  description?: string;
  state: 'opened' | 'closed' | 'locked' | 'merged';
  created_at: string;
  updated_at: string;
  merged_at?: string;
  closed_at?: string;
  target_branch: string;
  source_branch: string;
  source_project_id: number;
  target_project_id: number;
  author: GitLabUser;
  assignee?: GitLabUser;
  assignees?: GitLabUser[];
  reviewers?: GitLabUser[];
  labels: string[];
  milestone?: GitLabMilestone;
  merge_status: string;
  sha: string;
  merge_commit_sha?: string;
  squash_commit_sha?: string;
  web_url: string;
  work_in_progress: boolean;
  draft: boolean;
  has_conflicts: boolean;
  blocking_discussions_resolved: boolean;
  changes_count?: string;
  user_notes_count: number;
  upvotes: number;
  downvotes: number;
}

export interface MergeRequestCreateInput {
  source_branch: string;
  target_branch: string;
  title: string;
  description?: string;
  assignee_id?: number;
  assignee_ids?: number[];
  reviewer_ids?: number[];
  labels?: string;
  milestone_id?: number;
  remove_source_branch?: boolean;
  squash?: boolean;
  draft?: boolean;
}

export interface MergeRequestUpdateInput {
  title?: string;
  description?: string;
  target_branch?: string;
  assignee_id?: number;
  assignee_ids?: number[];
  reviewer_ids?: number[];
  labels?: string;
  milestone_id?: number;
  state_event?: 'close' | 'reopen';
  remove_source_branch?: boolean;
  squash?: boolean;
  draft?: boolean;
}

// =============================================================================
// Issue
// =============================================================================

export interface GitLabIssue {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  description?: string;
  state: 'opened' | 'closed';
  created_at: string;
  updated_at: string;
  closed_at?: string;
  closed_by?: GitLabUser;
  author: GitLabUser;
  assignee?: GitLabUser;
  assignees?: GitLabUser[];
  labels: string[];
  milestone?: GitLabMilestone;
  web_url: string;
  due_date?: string;
  confidential: boolean;
  weight?: number;
  user_notes_count: number;
  upvotes: number;
  downvotes: number;
  issue_type: 'issue' | 'incident' | 'test_case' | 'task';
}

export interface IssueCreateInput {
  title: string;
  description?: string;
  assignee_id?: number;
  assignee_ids?: number[];
  labels?: string;
  milestone_id?: number;
  due_date?: string;
  confidential?: boolean;
  weight?: number;
  issue_type?: 'issue' | 'incident' | 'test_case' | 'task';
}

export interface IssueUpdateInput {
  title?: string;
  description?: string;
  assignee_id?: number;
  assignee_ids?: number[];
  labels?: string;
  milestone_id?: number;
  state_event?: 'close' | 'reopen';
  due_date?: string;
  confidential?: boolean;
  weight?: number;
}

// =============================================================================
// Milestone
// =============================================================================

export interface GitLabMilestone {
  id: number;
  iid: number;
  project_id?: number;
  group_id?: number;
  title: string;
  description?: string;
  state: 'active' | 'closed';
  created_at: string;
  updated_at: string;
  due_date?: string;
  start_date?: string;
  expired: boolean;
  web_url: string;
}

// =============================================================================
// Pipeline
// =============================================================================

export interface GitLabPipeline {
  id: number;
  iid: number;
  project_id: number;
  sha: string;
  ref: string;
  status: PipelineStatus;
  source: string;
  created_at: string;
  updated_at: string;
  web_url: string;
  name?: string;
  user?: GitLabUser;
  started_at?: string;
  finished_at?: string;
  duration?: number;
  queued_duration?: number;
  coverage?: string;
  detailed_status?: {
    icon: string;
    text: string;
    label: string;
    group: string;
    tooltip: string;
    has_details: boolean;
    details_path: string;
  };
}

export type PipelineStatus =
  | 'created'
  | 'waiting_for_resource'
  | 'preparing'
  | 'pending'
  | 'running'
  | 'success'
  | 'failed'
  | 'canceled'
  | 'skipped'
  | 'manual'
  | 'scheduled';

export interface PipelineCreateInput {
  ref: string;
  variables?: Array<{ key: string; value: string; variable_type?: string }>;
}

// =============================================================================
// Job
// =============================================================================

export interface GitLabJob {
  id: number;
  name: string;
  stage: string;
  status: JobStatus;
  ref: string;
  tag: boolean;
  coverage?: number;
  allow_failure: boolean;
  created_at: string;
  started_at?: string;
  finished_at?: string;
  duration?: number;
  queued_duration?: number;
  user: GitLabUser;
  commit: GitLabCommit;
  pipeline: {
    id: number;
    project_id: number;
    ref: string;
    sha: string;
    status: PipelineStatus;
  };
  web_url: string;
  artifacts: Array<{
    file_type: string;
    size: number;
    filename: string;
  }>;
  runner?: {
    id: number;
    name: string;
    description: string;
    active: boolean;
    is_shared: boolean;
  };
  artifacts_expire_at?: string;
  failure_reason?: string;
}

export type JobStatus =
  | 'created'
  | 'pending'
  | 'running'
  | 'failed'
  | 'success'
  | 'canceled'
  | 'skipped'
  | 'waiting_for_resource'
  | 'manual';

// =============================================================================
// Group
// =============================================================================

export interface GitLabGroup {
  id: number;
  name: string;
  path: string;
  full_name: string;
  full_path: string;
  description?: string;
  visibility: 'private' | 'internal' | 'public';
  web_url: string;
  avatar_url?: string;
  parent_id?: number;
  created_at: string;
  projects?: GitLabProject[];
  shared_projects?: GitLabProject[];
}

export interface GroupCreateInput {
  name: string;
  path: string;
  description?: string;
  visibility?: 'private' | 'internal' | 'public';
  parent_id?: number;
}

export interface GroupUpdateInput {
  name?: string;
  path?: string;
  description?: string;
  visibility?: 'private' | 'internal' | 'public';
}

// =============================================================================
// Note (Comment)
// =============================================================================

export interface GitLabNote {
  id: number;
  body: string;
  author: GitLabUser;
  created_at: string;
  updated_at: string;
  system: boolean;
  noteable_id: number;
  noteable_type: 'Issue' | 'MergeRequest' | 'Snippet' | 'Commit';
  resolvable: boolean;
  resolved?: boolean;
  resolved_by?: GitLabUser;
  confidential: boolean;
  internal: boolean;
}

export interface NoteCreateInput {
  body: string;
  internal?: boolean;
}

// =============================================================================
// Label
// =============================================================================

export interface GitLabLabel {
  id: number;
  name: string;
  color: string;
  text_color: string;
  description?: string;
  open_issues_count?: number;
  closed_issues_count?: number;
  open_merge_requests_count?: number;
  subscribed: boolean;
  priority?: number;
  is_project_label: boolean;
}

export interface LabelCreateInput {
  name: string;
  color: string;
  description?: string;
  priority?: number;
}

export interface LabelUpdateInput {
  new_name?: string;
  color?: string;
  description?: string;
  priority?: number;
}

// =============================================================================
// Release
// =============================================================================

export interface GitLabRelease {
  tag_name: string;
  name: string;
  description?: string;
  description_html?: string;
  created_at: string;
  released_at: string;
  author: GitLabUser;
  commit: GitLabCommit;
  milestones?: GitLabMilestone[];
  commit_path: string;
  tag_path: string;
  assets: {
    count: number;
    sources: Array<{
      format: string;
      url: string;
    }>;
    links: Array<{
      id: number;
      name: string;
      url: string;
      direct_asset_url: string;
      link_type: string;
    }>;
  };
  evidences?: Array<{
    sha: string;
    filepath: string;
    collected_at: string;
  }>;
}

export interface ReleaseCreateInput {
  tag_name: string;
  name?: string;
  description?: string;
  ref?: string;
  milestones?: string[];
  released_at?: string;
  assets?: {
    links?: Array<{
      name: string;
      url: string;
      direct_asset_path?: string;
      link_type?: 'other' | 'runbook' | 'image' | 'package';
    }>;
  };
}

export interface ReleaseUpdateInput {
  name?: string;
  description?: string;
  milestones?: string[];
  released_at?: string;
}

// =============================================================================
// Repository File
// =============================================================================

export interface GitLabFile {
  file_name: string;
  file_path: string;
  size: number;
  encoding: string;
  content_sha256: string;
  ref: string;
  blob_id: string;
  commit_id: string;
  last_commit_id: string;
  content?: string;
  execute_filemode: boolean;
}

export interface FileCreateInput {
  branch: string;
  content: string;
  commit_message: string;
  author_email?: string;
  author_name?: string;
  encoding?: 'text' | 'base64';
  start_branch?: string;
}

export interface FileUpdateInput {
  branch: string;
  content: string;
  commit_message: string;
  author_email?: string;
  author_name?: string;
  encoding?: 'text' | 'base64';
  last_commit_id?: string;
  start_branch?: string;
}

export interface FileDeleteInput {
  branch: string;
  commit_message: string;
  author_email?: string;
  author_name?: string;
  last_commit_id?: string;
  start_branch?: string;
}

// =============================================================================
// CI/CD Variable
// =============================================================================

export interface GitLabVariable {
  key: string;
  value: string;
  variable_type: 'env_var' | 'file';
  protected: boolean;
  masked: boolean;
  raw: boolean;
  environment_scope: string;
  description?: string;
}

export interface VariableCreateInput {
  key: string;
  value: string;
  variable_type?: 'env_var' | 'file';
  protected?: boolean;
  masked?: boolean;
  raw?: boolean;
  environment_scope?: string;
  description?: string;
}

export interface VariableUpdateInput {
  value: string;
  variable_type?: 'env_var' | 'file';
  protected?: boolean;
  masked?: boolean;
  raw?: boolean;
  environment_scope?: string;
  description?: string;
}

// =============================================================================
// Project Member
// =============================================================================

export interface GitLabMember {
  id: number;
  username: string;
  name: string;
  state: string;
  avatar_url?: string;
  web_url: string;
  access_level: number;
  expires_at?: string;
}

export interface MemberAddInput {
  user_id: number;
  access_level: number;
  expires_at?: string;
}

export interface MemberUpdateInput {
  access_level: number;
  expires_at?: string;
}

// =============================================================================
// Webhook
// =============================================================================

export interface GitLabWebhook {
  id: number;
  url: string;
  project_id: number;
  push_events: boolean;
  push_events_branch_filter?: string;
  issues_events: boolean;
  confidential_issues_events: boolean;
  merge_requests_events: boolean;
  tag_push_events: boolean;
  note_events: boolean;
  confidential_note_events: boolean;
  job_events: boolean;
  pipeline_events: boolean;
  wiki_page_events: boolean;
  deployment_events: boolean;
  releases_events: boolean;
  enable_ssl_verification: boolean;
  created_at: string;
}

export interface WebhookCreateInput {
  url: string;
  token?: string;
  push_events?: boolean;
  push_events_branch_filter?: string;
  issues_events?: boolean;
  confidential_issues_events?: boolean;
  merge_requests_events?: boolean;
  tag_push_events?: boolean;
  note_events?: boolean;
  confidential_note_events?: boolean;
  job_events?: boolean;
  pipeline_events?: boolean;
  wiki_page_events?: boolean;
  deployment_events?: boolean;
  releases_events?: boolean;
  enable_ssl_verification?: boolean;
}

// =============================================================================
// Runner
// =============================================================================

export interface GitLabRunner {
  id: number;
  description: string;
  ip_address?: string;
  active: boolean;
  paused: boolean;
  is_shared: boolean;
  runner_type: 'instance_type' | 'group_type' | 'project_type';
  name?: string;
  online: boolean;
  status: 'online' | 'offline' | 'stale' | 'never_contacted';
  tag_list: string[];
}

// =============================================================================
// Search
// =============================================================================

export interface SearchParams extends PaginationParams {
  search?: string;
  scope?: string;
}

// =============================================================================
// Repository Tree
// =============================================================================

export interface GitLabTreeItem {
  id: string;
  name: string;
  type: 'blob' | 'tree';
  path: string;
  mode: string;
}

// =============================================================================
// Commit Diff
// =============================================================================

export interface GitLabDiff {
  old_path: string;
  new_path: string;
  a_mode: string;
  b_mode: string;
  new_file: boolean;
  renamed_file: boolean;
  deleted_file: boolean;
  diff: string;
}

// =============================================================================
// Compare
// =============================================================================

export interface GitLabCompare {
  commit: GitLabCommit;
  commits: GitLabCommit[];
  diffs: GitLabDiff[];
  compare_timeout: boolean;
  compare_same_ref: boolean;
}
