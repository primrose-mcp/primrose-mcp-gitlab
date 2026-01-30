/**
 * GitLab API Client
 *
 * This file handles all HTTP communication with the GitLab API.
 *
 * MULTI-TENANT: This client receives credentials per-request via TenantCredentials,
 * allowing a single server to serve multiple tenants with different API keys.
 */

import type {
  BranchCreateInput,
  CommitCreateInput,
  FileCreateInput,
  FileDeleteInput,
  FileUpdateInput,
  GitLabBranch,
  GitLabCommit,
  GitLabCompare,
  GitLabDiff,
  GitLabFile,
  GitLabGroup,
  GitLabIssue,
  GitLabJob,
  GitLabLabel,
  GitLabMember,
  GitLabMergeRequest,
  GitLabNote,
  GitLabPipeline,
  GitLabProject,
  GitLabRelease,
  GitLabRunner,
  GitLabTag,
  GitLabTreeItem,
  GitLabUser,
  GitLabVariable,
  GitLabWebhook,
  GroupCreateInput,
  GroupUpdateInput,
  IssueCreateInput,
  IssueUpdateInput,
  LabelCreateInput,
  LabelUpdateInput,
  MemberAddInput,
  MemberUpdateInput,
  MergeRequestCreateInput,
  MergeRequestUpdateInput,
  NoteCreateInput,
  PaginatedResponse,
  PaginationParams,
  PipelineCreateInput,
  PipelineStatus,
  ProjectCreateInput,
  ProjectUpdateInput,
  ReleaseCreateInput,
  ReleaseUpdateInput,
  TagCreateInput,
  VariableCreateInput,
  VariableUpdateInput,
  WebhookCreateInput,
} from './types/entities.js';
import type { TenantCredentials } from './types/env.js';
import { AuthenticationError, GitLabApiError, RateLimitError } from './utils/errors.js';

// =============================================================================
// Configuration
// =============================================================================

const DEFAULT_API_BASE_URL = 'https://gitlab.com/api/v4';

// =============================================================================
// GitLab Client Interface
// =============================================================================

export interface GitLabClient {
  // Connection
  testConnection(): Promise<{ connected: boolean; message: string; user?: GitLabUser }>;
  getCurrentUser(): Promise<GitLabUser>;

  // Projects
  listProjects(params?: {
    membership?: boolean;
    owned?: boolean;
    search?: string;
    visibility?: string;
    archived?: boolean;
    orderBy?: string;
    sort?: 'asc' | 'desc';
  } & PaginationParams): Promise<PaginatedResponse<GitLabProject>>;
  getProject(projectId: string | number): Promise<GitLabProject>;
  createProject(input: ProjectCreateInput): Promise<GitLabProject>;
  updateProject(projectId: string | number, input: ProjectUpdateInput): Promise<GitLabProject>;
  deleteProject(projectId: string | number): Promise<void>;
  forkProject(projectId: string | number, namespace?: string): Promise<GitLabProject>;
  starProject(projectId: string | number): Promise<GitLabProject>;
  unstarProject(projectId: string | number): Promise<GitLabProject>;

  // Branches
  listBranches(projectId: string | number, params?: { search?: string } & PaginationParams): Promise<PaginatedResponse<GitLabBranch>>;
  getBranch(projectId: string | number, branchName: string): Promise<GitLabBranch>;
  createBranch(projectId: string | number, input: BranchCreateInput): Promise<GitLabBranch>;
  deleteBranch(projectId: string | number, branchName: string): Promise<void>;
  deleteMergedBranches(projectId: string | number): Promise<void>;

  // Commits
  listCommits(projectId: string | number, params?: { refName?: string; path?: string; since?: string; until?: string; withStats?: boolean } & PaginationParams): Promise<PaginatedResponse<GitLabCommit>>;
  getCommit(projectId: string | number, sha: string): Promise<GitLabCommit>;
  createCommit(projectId: string | number, input: CommitCreateInput): Promise<GitLabCommit>;
  getCommitDiff(projectId: string | number, sha: string): Promise<GitLabDiff[]>;
  cherryPickCommit(projectId: string | number, sha: string, branch: string): Promise<GitLabCommit>;
  revertCommit(projectId: string | number, sha: string, branch: string): Promise<GitLabCommit>;

  // Tags
  listTags(projectId: string | number, params?: { search?: string; orderBy?: string; sort?: 'asc' | 'desc' } & PaginationParams): Promise<PaginatedResponse<GitLabTag>>;
  getTag(projectId: string | number, tagName: string): Promise<GitLabTag>;
  createTag(projectId: string | number, input: TagCreateInput): Promise<GitLabTag>;
  deleteTag(projectId: string | number, tagName: string): Promise<void>;

  // Repository
  getRepositoryTree(projectId: string | number, params?: { path?: string; ref?: string; recursive?: boolean } & PaginationParams): Promise<PaginatedResponse<GitLabTreeItem>>;
  compareRefs(projectId: string | number, from: string, to: string): Promise<GitLabCompare>;

  // Files
  getFile(projectId: string | number, filePath: string, ref: string): Promise<GitLabFile>;
  getFileRaw(projectId: string | number, filePath: string, ref: string): Promise<string>;
  createFile(projectId: string | number, filePath: string, input: FileCreateInput): Promise<GitLabFile>;
  updateFile(projectId: string | number, filePath: string, input: FileUpdateInput): Promise<GitLabFile>;
  deleteFile(projectId: string | number, filePath: string, input: FileDeleteInput): Promise<void>;

  // Merge Requests
  listMergeRequests(projectId: string | number, params?: { state?: string; scope?: string; orderBy?: string; sort?: 'asc' | 'desc'; labels?: string; authorId?: number; assigneeId?: number; search?: string } & PaginationParams): Promise<PaginatedResponse<GitLabMergeRequest>>;
  getMergeRequest(projectId: string | number, mrIid: number): Promise<GitLabMergeRequest>;
  createMergeRequest(projectId: string | number, input: MergeRequestCreateInput): Promise<GitLabMergeRequest>;
  updateMergeRequest(projectId: string | number, mrIid: number, input: MergeRequestUpdateInput): Promise<GitLabMergeRequest>;
  acceptMergeRequest(projectId: string | number, mrIid: number, params?: { mergeWhenPipelineSucceeds?: boolean; shouldRemoveSourceBranch?: boolean; squash?: boolean }): Promise<GitLabMergeRequest>;
  approveMergeRequest(projectId: string | number, mrIid: number): Promise<void>;
  rebaseMergeRequest(projectId: string | number, mrIid: number): Promise<void>;
  getMergeRequestDiff(projectId: string | number, mrIid: number): Promise<GitLabDiff[]>;

  // Issues
  listIssues(projectId: string | number, params?: { state?: string; labels?: string; milestone?: string; scope?: string; authorId?: number; assigneeId?: number; search?: string; orderBy?: string; sort?: 'asc' | 'desc' } & PaginationParams): Promise<PaginatedResponse<GitLabIssue>>;
  getIssue(projectId: string | number, issueIid: number): Promise<GitLabIssue>;
  createIssue(projectId: string | number, input: IssueCreateInput): Promise<GitLabIssue>;
  updateIssue(projectId: string | number, issueIid: number, input: IssueUpdateInput): Promise<GitLabIssue>;
  deleteIssue(projectId: string | number, issueIid: number): Promise<void>;

  // Notes (Comments)
  listIssueNotes(projectId: string | number, issueIid: number, params?: PaginationParams): Promise<PaginatedResponse<GitLabNote>>;
  createIssueNote(projectId: string | number, issueIid: number, input: NoteCreateInput): Promise<GitLabNote>;
  listMergeRequestNotes(projectId: string | number, mrIid: number, params?: PaginationParams): Promise<PaginatedResponse<GitLabNote>>;
  createMergeRequestNote(projectId: string | number, mrIid: number, input: NoteCreateInput): Promise<GitLabNote>;

  // Labels
  listLabels(projectId: string | number, params?: { search?: string } & PaginationParams): Promise<PaginatedResponse<GitLabLabel>>;
  getLabel(projectId: string | number, labelId: number | string): Promise<GitLabLabel>;
  createLabel(projectId: string | number, input: LabelCreateInput): Promise<GitLabLabel>;
  updateLabel(projectId: string | number, labelId: number | string, input: LabelUpdateInput): Promise<GitLabLabel>;
  deleteLabel(projectId: string | number, labelId: number | string): Promise<void>;

  // Pipelines
  listPipelines(projectId: string | number, params?: { ref?: string; status?: PipelineStatus; scope?: string; orderBy?: string; sort?: 'asc' | 'desc' } & PaginationParams): Promise<PaginatedResponse<GitLabPipeline>>;
  getPipeline(projectId: string | number, pipelineId: number): Promise<GitLabPipeline>;
  createPipeline(projectId: string | number, input: PipelineCreateInput): Promise<GitLabPipeline>;
  retryPipeline(projectId: string | number, pipelineId: number): Promise<GitLabPipeline>;
  cancelPipeline(projectId: string | number, pipelineId: number): Promise<GitLabPipeline>;
  deletePipeline(projectId: string | number, pipelineId: number): Promise<void>;

  // Jobs
  listPipelineJobs(projectId: string | number, pipelineId: number, params?: { scope?: string } & PaginationParams): Promise<PaginatedResponse<GitLabJob>>;
  getJob(projectId: string | number, jobId: number): Promise<GitLabJob>;
  getJobLog(projectId: string | number, jobId: number): Promise<string>;
  retryJob(projectId: string | number, jobId: number): Promise<GitLabJob>;
  cancelJob(projectId: string | number, jobId: number): Promise<GitLabJob>;
  playJob(projectId: string | number, jobId: number): Promise<GitLabJob>;

  // Releases
  listReleases(projectId: string | number, params?: PaginationParams): Promise<PaginatedResponse<GitLabRelease>>;
  getRelease(projectId: string | number, tagName: string): Promise<GitLabRelease>;
  createRelease(projectId: string | number, input: ReleaseCreateInput): Promise<GitLabRelease>;
  updateRelease(projectId: string | number, tagName: string, input: ReleaseUpdateInput): Promise<GitLabRelease>;
  deleteRelease(projectId: string | number, tagName: string): Promise<void>;

  // Groups
  listGroups(params?: { search?: string; owned?: boolean; visibility?: string; orderBy?: string; sort?: 'asc' | 'desc' } & PaginationParams): Promise<PaginatedResponse<GitLabGroup>>;
  getGroup(groupId: string | number): Promise<GitLabGroup>;
  createGroup(input: GroupCreateInput): Promise<GitLabGroup>;
  updateGroup(groupId: string | number, input: GroupUpdateInput): Promise<GitLabGroup>;
  deleteGroup(groupId: string | number): Promise<void>;
  listGroupProjects(groupId: string | number, params?: { search?: string; archived?: boolean } & PaginationParams): Promise<PaginatedResponse<GitLabProject>>;

  // Users
  listUsers(params?: { search?: string; username?: string; active?: boolean; blocked?: boolean } & PaginationParams): Promise<PaginatedResponse<GitLabUser>>;
  getUser(userId: number): Promise<GitLabUser>;

  // Members
  listProjectMembers(projectId: string | number, params?: { search?: string } & PaginationParams): Promise<PaginatedResponse<GitLabMember>>;
  addProjectMember(projectId: string | number, input: MemberAddInput): Promise<GitLabMember>;
  updateProjectMember(projectId: string | number, userId: number, input: MemberUpdateInput): Promise<GitLabMember>;
  removeProjectMember(projectId: string | number, userId: number): Promise<void>;

  // Variables
  listProjectVariables(projectId: string | number, params?: PaginationParams): Promise<PaginatedResponse<GitLabVariable>>;
  getProjectVariable(projectId: string | number, key: string): Promise<GitLabVariable>;
  createProjectVariable(projectId: string | number, input: VariableCreateInput): Promise<GitLabVariable>;
  updateProjectVariable(projectId: string | number, key: string, input: VariableUpdateInput): Promise<GitLabVariable>;
  deleteProjectVariable(projectId: string | number, key: string): Promise<void>;

  // Webhooks
  listProjectWebhooks(projectId: string | number, params?: PaginationParams): Promise<PaginatedResponse<GitLabWebhook>>;
  createProjectWebhook(projectId: string | number, input: WebhookCreateInput): Promise<GitLabWebhook>;
  deleteProjectWebhook(projectId: string | number, hookId: number): Promise<void>;

  // Runners
  listProjectRunners(projectId: string | number, params?: { status?: string; tagList?: string } & PaginationParams): Promise<PaginatedResponse<GitLabRunner>>;
}

// =============================================================================
// GitLab Client Implementation
// =============================================================================

class GitLabClientImpl implements GitLabClient {
  private credentials: TenantCredentials;
  private baseUrl: string;

  constructor(credentials: TenantCredentials) {
    this.credentials = credentials;
    this.baseUrl = credentials.baseUrl || DEFAULT_API_BASE_URL;
  }

  // ===========================================================================
  // HTTP Request Helper
  // ===========================================================================

  private getAuthHeaders(): Record<string, string> {
    if (this.credentials.accessToken) {
      return {
        Authorization: `Bearer ${this.credentials.accessToken}`,
        'Content-Type': 'application/json',
      };
    }

    if (this.credentials.privateToken) {
      return {
        'PRIVATE-TOKEN': this.credentials.privateToken,
        'Content-Type': 'application/json',
      };
    }

    throw new AuthenticationError(
      'No credentials provided. Include X-GitLab-Token or X-GitLab-Access-Token header.'
    );
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...(options.headers || {}),
      },
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new RateLimitError('Rate limit exceeded', retryAfter ? parseInt(retryAfter, 10) : 60);
    }

    if (response.status === 401 || response.status === 403) {
      throw new AuthenticationError('Authentication failed. Check your GitLab credentials.');
    }

    if (!response.ok) {
      const errorBody = await response.text();
      let message = `API error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorBody);
        message = errorJson.message || errorJson.error || message;
      } catch {
        // Use default message
      }
      throw new GitLabApiError(message, response.status);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json() as Promise<T>;
  }

  private async requestWithPagination<T>(
    endpoint: string,
    params?: PaginationParams,
    options: RequestInit = {}
  ): Promise<PaginatedResponse<T>> {
    const queryParams = new URLSearchParams();
    if (params?.perPage) queryParams.set('per_page', String(params.perPage));
    if (params?.page) queryParams.set('page', String(params.page));

    const separator = endpoint.includes('?') ? '&' : '?';
    const queryString = queryParams.toString();
    const url = `${this.baseUrl}${endpoint}${queryString ? `${separator}${queryString}` : ''}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getAuthHeaders(),
        ...(options.headers || {}),
      },
    });

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new RateLimitError('Rate limit exceeded', retryAfter ? parseInt(retryAfter, 10) : 60);
    }

    if (response.status === 401 || response.status === 403) {
      throw new AuthenticationError('Authentication failed. Check your GitLab credentials.');
    }

    if (!response.ok) {
      const errorBody = await response.text();
      let message = `API error: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorBody);
        message = errorJson.message || errorJson.error || message;
      } catch {
        // Use default message
      }
      throw new GitLabApiError(message, response.status);
    }

    const items = (await response.json()) as T[];
    const total = response.headers.get('X-Total')
      ? parseInt(response.headers.get('X-Total')!, 10)
      : undefined;
    const totalPages = response.headers.get('X-Total-Pages')
      ? parseInt(response.headers.get('X-Total-Pages')!, 10)
      : undefined;
    const nextPage = response.headers.get('X-Next-Page')
      ? parseInt(response.headers.get('X-Next-Page')!, 10)
      : undefined;

    return {
      items,
      count: items.length,
      total,
      totalPages,
      hasMore: nextPage !== undefined,
      nextPage,
    };
  }

  private buildQueryString(params: object): string {
    const queryParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && key !== 'perPage' && key !== 'page') {
        queryParams.set(this.toSnakeCase(key), String(value));
      }
    }
    return queryParams.toString();
  }

  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  // ===========================================================================
  // Connection
  // ===========================================================================

  async testConnection(): Promise<{ connected: boolean; message: string; user?: GitLabUser }> {
    try {
      const user = await this.getCurrentUser();
      return { connected: true, message: `Connected as ${user.username}`, user };
    } catch (error) {
      return {
        connected: false,
        message: error instanceof Error ? error.message : 'Connection failed',
      };
    }
  }

  async getCurrentUser(): Promise<GitLabUser> {
    return this.request<GitLabUser>('/user');
  }

  // ===========================================================================
  // Projects
  // ===========================================================================

  async listProjects(params?: {
    membership?: boolean;
    owned?: boolean;
    search?: string;
    visibility?: string;
    archived?: boolean;
    orderBy?: string;
    sort?: 'asc' | 'desc';
  } & PaginationParams): Promise<PaginatedResponse<GitLabProject>> {
    const query = params ? this.buildQueryString(params) : '';
    return this.requestWithPagination<GitLabProject>(`/projects${query ? `?${query}` : ''}`, params);
  }

  async getProject(projectId: string | number): Promise<GitLabProject> {
    const encoded = encodeURIComponent(String(projectId));
    return this.request<GitLabProject>(`/projects/${encoded}`);
  }

  async createProject(input: ProjectCreateInput): Promise<GitLabProject> {
    return this.request<GitLabProject>('/projects', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateProject(projectId: string | number, input: ProjectUpdateInput): Promise<GitLabProject> {
    const encoded = encodeURIComponent(String(projectId));
    return this.request<GitLabProject>(`/projects/${encoded}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  async deleteProject(projectId: string | number): Promise<void> {
    const encoded = encodeURIComponent(String(projectId));
    await this.request<void>(`/projects/${encoded}`, { method: 'DELETE' });
  }

  async forkProject(projectId: string | number, namespace?: string): Promise<GitLabProject> {
    const encoded = encodeURIComponent(String(projectId));
    const body = namespace ? JSON.stringify({ namespace }) : undefined;
    return this.request<GitLabProject>(`/projects/${encoded}/fork`, {
      method: 'POST',
      body,
    });
  }

  async starProject(projectId: string | number): Promise<GitLabProject> {
    const encoded = encodeURIComponent(String(projectId));
    return this.request<GitLabProject>(`/projects/${encoded}/star`, { method: 'POST' });
  }

  async unstarProject(projectId: string | number): Promise<GitLabProject> {
    const encoded = encodeURIComponent(String(projectId));
    return this.request<GitLabProject>(`/projects/${encoded}/unstar`, { method: 'POST' });
  }

  // ===========================================================================
  // Branches
  // ===========================================================================

  async listBranches(projectId: string | number, params?: { search?: string } & PaginationParams): Promise<PaginatedResponse<GitLabBranch>> {
    const encoded = encodeURIComponent(String(projectId));
    const query = params ? this.buildQueryString(params) : '';
    return this.requestWithPagination<GitLabBranch>(`/projects/${encoded}/repository/branches${query ? `?${query}` : ''}`, params);
  }

  async getBranch(projectId: string | number, branchName: string): Promise<GitLabBranch> {
    const projectEncoded = encodeURIComponent(String(projectId));
    const branchEncoded = encodeURIComponent(branchName);
    return this.request<GitLabBranch>(`/projects/${projectEncoded}/repository/branches/${branchEncoded}`);
  }

  async createBranch(projectId: string | number, input: BranchCreateInput): Promise<GitLabBranch> {
    const encoded = encodeURIComponent(String(projectId));
    return this.request<GitLabBranch>(`/projects/${encoded}/repository/branches`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async deleteBranch(projectId: string | number, branchName: string): Promise<void> {
    const projectEncoded = encodeURIComponent(String(projectId));
    const branchEncoded = encodeURIComponent(branchName);
    await this.request<void>(`/projects/${projectEncoded}/repository/branches/${branchEncoded}`, { method: 'DELETE' });
  }

  async deleteMergedBranches(projectId: string | number): Promise<void> {
    const encoded = encodeURIComponent(String(projectId));
    await this.request<void>(`/projects/${encoded}/repository/merged_branches`, { method: 'DELETE' });
  }

  // ===========================================================================
  // Commits
  // ===========================================================================

  async listCommits(projectId: string | number, params?: { refName?: string; path?: string; since?: string; until?: string; withStats?: boolean } & PaginationParams): Promise<PaginatedResponse<GitLabCommit>> {
    const encoded = encodeURIComponent(String(projectId));
    const query = params ? this.buildQueryString(params) : '';
    return this.requestWithPagination<GitLabCommit>(`/projects/${encoded}/repository/commits${query ? `?${query}` : ''}`, params);
  }

  async getCommit(projectId: string | number, sha: string): Promise<GitLabCommit> {
    const encoded = encodeURIComponent(String(projectId));
    return this.request<GitLabCommit>(`/projects/${encoded}/repository/commits/${sha}`);
  }

  async createCommit(projectId: string | number, input: CommitCreateInput): Promise<GitLabCommit> {
    const encoded = encodeURIComponent(String(projectId));
    return this.request<GitLabCommit>(`/projects/${encoded}/repository/commits`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async getCommitDiff(projectId: string | number, sha: string): Promise<GitLabDiff[]> {
    const encoded = encodeURIComponent(String(projectId));
    return this.request<GitLabDiff[]>(`/projects/${encoded}/repository/commits/${sha}/diff`);
  }

  async cherryPickCommit(projectId: string | number, sha: string, branch: string): Promise<GitLabCommit> {
    const encoded = encodeURIComponent(String(projectId));
    return this.request<GitLabCommit>(`/projects/${encoded}/repository/commits/${sha}/cherry_pick`, {
      method: 'POST',
      body: JSON.stringify({ branch }),
    });
  }

  async revertCommit(projectId: string | number, sha: string, branch: string): Promise<GitLabCommit> {
    const encoded = encodeURIComponent(String(projectId));
    return this.request<GitLabCommit>(`/projects/${encoded}/repository/commits/${sha}/revert`, {
      method: 'POST',
      body: JSON.stringify({ branch }),
    });
  }

  // ===========================================================================
  // Tags
  // ===========================================================================

  async listTags(projectId: string | number, params?: { search?: string; orderBy?: string; sort?: 'asc' | 'desc' } & PaginationParams): Promise<PaginatedResponse<GitLabTag>> {
    const encoded = encodeURIComponent(String(projectId));
    const query = params ? this.buildQueryString(params) : '';
    return this.requestWithPagination<GitLabTag>(`/projects/${encoded}/repository/tags${query ? `?${query}` : ''}`, params);
  }

  async getTag(projectId: string | number, tagName: string): Promise<GitLabTag> {
    const projectEncoded = encodeURIComponent(String(projectId));
    const tagEncoded = encodeURIComponent(tagName);
    return this.request<GitLabTag>(`/projects/${projectEncoded}/repository/tags/${tagEncoded}`);
  }

  async createTag(projectId: string | number, input: TagCreateInput): Promise<GitLabTag> {
    const encoded = encodeURIComponent(String(projectId));
    return this.request<GitLabTag>(`/projects/${encoded}/repository/tags`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async deleteTag(projectId: string | number, tagName: string): Promise<void> {
    const projectEncoded = encodeURIComponent(String(projectId));
    const tagEncoded = encodeURIComponent(tagName);
    await this.request<void>(`/projects/${projectEncoded}/repository/tags/${tagEncoded}`, { method: 'DELETE' });
  }

  // ===========================================================================
  // Repository
  // ===========================================================================

  async getRepositoryTree(projectId: string | number, params?: { path?: string; ref?: string; recursive?: boolean } & PaginationParams): Promise<PaginatedResponse<GitLabTreeItem>> {
    const encoded = encodeURIComponent(String(projectId));
    const query = params ? this.buildQueryString(params) : '';
    return this.requestWithPagination<GitLabTreeItem>(`/projects/${encoded}/repository/tree${query ? `?${query}` : ''}`, params);
  }

  async compareRefs(projectId: string | number, from: string, to: string): Promise<GitLabCompare> {
    const encoded = encodeURIComponent(String(projectId));
    return this.request<GitLabCompare>(`/projects/${encoded}/repository/compare?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
  }

  // ===========================================================================
  // Files
  // ===========================================================================

  async getFile(projectId: string | number, filePath: string, ref: string): Promise<GitLabFile> {
    const projectEncoded = encodeURIComponent(String(projectId));
    const fileEncoded = encodeURIComponent(filePath);
    return this.request<GitLabFile>(`/projects/${projectEncoded}/repository/files/${fileEncoded}?ref=${encodeURIComponent(ref)}`);
  }

  async getFileRaw(projectId: string | number, filePath: string, ref: string): Promise<string> {
    const projectEncoded = encodeURIComponent(String(projectId));
    const fileEncoded = encodeURIComponent(filePath);
    const url = `${this.baseUrl}/projects/${projectEncoded}/repository/files/${fileEncoded}/raw?ref=${encodeURIComponent(ref)}`;

    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new GitLabApiError(`Failed to get file: ${response.status}`, response.status);
    }

    return response.text();
  }

  async createFile(projectId: string | number, filePath: string, input: FileCreateInput): Promise<GitLabFile> {
    const projectEncoded = encodeURIComponent(String(projectId));
    const fileEncoded = encodeURIComponent(filePath);
    return this.request<GitLabFile>(`/projects/${projectEncoded}/repository/files/${fileEncoded}`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateFile(projectId: string | number, filePath: string, input: FileUpdateInput): Promise<GitLabFile> {
    const projectEncoded = encodeURIComponent(String(projectId));
    const fileEncoded = encodeURIComponent(filePath);
    return this.request<GitLabFile>(`/projects/${projectEncoded}/repository/files/${fileEncoded}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  async deleteFile(projectId: string | number, filePath: string, input: FileDeleteInput): Promise<void> {
    const projectEncoded = encodeURIComponent(String(projectId));
    const fileEncoded = encodeURIComponent(filePath);
    await this.request<void>(`/projects/${projectEncoded}/repository/files/${fileEncoded}`, {
      method: 'DELETE',
      body: JSON.stringify(input),
    });
  }

  // ===========================================================================
  // Merge Requests
  // ===========================================================================

  async listMergeRequests(projectId: string | number, params?: { state?: string; scope?: string; orderBy?: string; sort?: 'asc' | 'desc'; labels?: string; authorId?: number; assigneeId?: number; search?: string } & PaginationParams): Promise<PaginatedResponse<GitLabMergeRequest>> {
    const encoded = encodeURIComponent(String(projectId));
    const query = params ? this.buildQueryString(params) : '';
    return this.requestWithPagination<GitLabMergeRequest>(`/projects/${encoded}/merge_requests${query ? `?${query}` : ''}`, params);
  }

  async getMergeRequest(projectId: string | number, mrIid: number): Promise<GitLabMergeRequest> {
    const encoded = encodeURIComponent(String(projectId));
    return this.request<GitLabMergeRequest>(`/projects/${encoded}/merge_requests/${mrIid}`);
  }

  async createMergeRequest(projectId: string | number, input: MergeRequestCreateInput): Promise<GitLabMergeRequest> {
    const encoded = encodeURIComponent(String(projectId));
    return this.request<GitLabMergeRequest>(`/projects/${encoded}/merge_requests`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateMergeRequest(projectId: string | number, mrIid: number, input: MergeRequestUpdateInput): Promise<GitLabMergeRequest> {
    const encoded = encodeURIComponent(String(projectId));
    return this.request<GitLabMergeRequest>(`/projects/${encoded}/merge_requests/${mrIid}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  async acceptMergeRequest(projectId: string | number, mrIid: number, params?: { mergeWhenPipelineSucceeds?: boolean; shouldRemoveSourceBranch?: boolean; squash?: boolean }): Promise<GitLabMergeRequest> {
    const encoded = encodeURIComponent(String(projectId));
    return this.request<GitLabMergeRequest>(`/projects/${encoded}/merge_requests/${mrIid}/merge`, {
      method: 'PUT',
      body: params ? JSON.stringify(params) : undefined,
    });
  }

  async approveMergeRequest(projectId: string | number, mrIid: number): Promise<void> {
    const encoded = encodeURIComponent(String(projectId));
    await this.request<void>(`/projects/${encoded}/merge_requests/${mrIid}/approve`, { method: 'POST' });
  }

  async rebaseMergeRequest(projectId: string | number, mrIid: number): Promise<void> {
    const encoded = encodeURIComponent(String(projectId));
    await this.request<void>(`/projects/${encoded}/merge_requests/${mrIid}/rebase`, { method: 'PUT' });
  }

  async getMergeRequestDiff(projectId: string | number, mrIid: number): Promise<GitLabDiff[]> {
    const encoded = encodeURIComponent(String(projectId));
    const response = await this.request<{ changes: GitLabDiff[] }>(`/projects/${encoded}/merge_requests/${mrIid}/changes`);
    return response.changes;
  }

  // ===========================================================================
  // Issues
  // ===========================================================================

  async listIssues(projectId: string | number, params?: { state?: string; labels?: string; milestone?: string; scope?: string; authorId?: number; assigneeId?: number; search?: string; orderBy?: string; sort?: 'asc' | 'desc' } & PaginationParams): Promise<PaginatedResponse<GitLabIssue>> {
    const encoded = encodeURIComponent(String(projectId));
    const query = params ? this.buildQueryString(params) : '';
    return this.requestWithPagination<GitLabIssue>(`/projects/${encoded}/issues${query ? `?${query}` : ''}`, params);
  }

  async getIssue(projectId: string | number, issueIid: number): Promise<GitLabIssue> {
    const encoded = encodeURIComponent(String(projectId));
    return this.request<GitLabIssue>(`/projects/${encoded}/issues/${issueIid}`);
  }

  async createIssue(projectId: string | number, input: IssueCreateInput): Promise<GitLabIssue> {
    const encoded = encodeURIComponent(String(projectId));
    return this.request<GitLabIssue>(`/projects/${encoded}/issues`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateIssue(projectId: string | number, issueIid: number, input: IssueUpdateInput): Promise<GitLabIssue> {
    const encoded = encodeURIComponent(String(projectId));
    return this.request<GitLabIssue>(`/projects/${encoded}/issues/${issueIid}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  async deleteIssue(projectId: string | number, issueIid: number): Promise<void> {
    const encoded = encodeURIComponent(String(projectId));
    await this.request<void>(`/projects/${encoded}/issues/${issueIid}`, { method: 'DELETE' });
  }

  // ===========================================================================
  // Notes (Comments)
  // ===========================================================================

  async listIssueNotes(projectId: string | number, issueIid: number, params?: PaginationParams): Promise<PaginatedResponse<GitLabNote>> {
    const encoded = encodeURIComponent(String(projectId));
    return this.requestWithPagination<GitLabNote>(`/projects/${encoded}/issues/${issueIid}/notes`, params);
  }

  async createIssueNote(projectId: string | number, issueIid: number, input: NoteCreateInput): Promise<GitLabNote> {
    const encoded = encodeURIComponent(String(projectId));
    return this.request<GitLabNote>(`/projects/${encoded}/issues/${issueIid}/notes`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async listMergeRequestNotes(projectId: string | number, mrIid: number, params?: PaginationParams): Promise<PaginatedResponse<GitLabNote>> {
    const encoded = encodeURIComponent(String(projectId));
    return this.requestWithPagination<GitLabNote>(`/projects/${encoded}/merge_requests/${mrIid}/notes`, params);
  }

  async createMergeRequestNote(projectId: string | number, mrIid: number, input: NoteCreateInput): Promise<GitLabNote> {
    const encoded = encodeURIComponent(String(projectId));
    return this.request<GitLabNote>(`/projects/${encoded}/merge_requests/${mrIid}/notes`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  // ===========================================================================
  // Labels
  // ===========================================================================

  async listLabels(projectId: string | number, params?: { search?: string } & PaginationParams): Promise<PaginatedResponse<GitLabLabel>> {
    const encoded = encodeURIComponent(String(projectId));
    const query = params ? this.buildQueryString(params) : '';
    return this.requestWithPagination<GitLabLabel>(`/projects/${encoded}/labels${query ? `?${query}` : ''}`, params);
  }

  async getLabel(projectId: string | number, labelId: number | string): Promise<GitLabLabel> {
    const projectEncoded = encodeURIComponent(String(projectId));
    const labelEncoded = encodeURIComponent(String(labelId));
    return this.request<GitLabLabel>(`/projects/${projectEncoded}/labels/${labelEncoded}`);
  }

  async createLabel(projectId: string | number, input: LabelCreateInput): Promise<GitLabLabel> {
    const encoded = encodeURIComponent(String(projectId));
    return this.request<GitLabLabel>(`/projects/${encoded}/labels`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateLabel(projectId: string | number, labelId: number | string, input: LabelUpdateInput): Promise<GitLabLabel> {
    const projectEncoded = encodeURIComponent(String(projectId));
    const labelEncoded = encodeURIComponent(String(labelId));
    return this.request<GitLabLabel>(`/projects/${projectEncoded}/labels/${labelEncoded}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  async deleteLabel(projectId: string | number, labelId: number | string): Promise<void> {
    const projectEncoded = encodeURIComponent(String(projectId));
    const labelEncoded = encodeURIComponent(String(labelId));
    await this.request<void>(`/projects/${projectEncoded}/labels/${labelEncoded}`, { method: 'DELETE' });
  }

  // ===========================================================================
  // Pipelines
  // ===========================================================================

  async listPipelines(projectId: string | number, params?: { ref?: string; status?: PipelineStatus; scope?: string; orderBy?: string; sort?: 'asc' | 'desc' } & PaginationParams): Promise<PaginatedResponse<GitLabPipeline>> {
    const encoded = encodeURIComponent(String(projectId));
    const query = params ? this.buildQueryString(params) : '';
    return this.requestWithPagination<GitLabPipeline>(`/projects/${encoded}/pipelines${query ? `?${query}` : ''}`, params);
  }

  async getPipeline(projectId: string | number, pipelineId: number): Promise<GitLabPipeline> {
    const encoded = encodeURIComponent(String(projectId));
    return this.request<GitLabPipeline>(`/projects/${encoded}/pipelines/${pipelineId}`);
  }

  async createPipeline(projectId: string | number, input: PipelineCreateInput): Promise<GitLabPipeline> {
    const encoded = encodeURIComponent(String(projectId));
    return this.request<GitLabPipeline>(`/projects/${encoded}/pipeline`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async retryPipeline(projectId: string | number, pipelineId: number): Promise<GitLabPipeline> {
    const encoded = encodeURIComponent(String(projectId));
    return this.request<GitLabPipeline>(`/projects/${encoded}/pipelines/${pipelineId}/retry`, { method: 'POST' });
  }

  async cancelPipeline(projectId: string | number, pipelineId: number): Promise<GitLabPipeline> {
    const encoded = encodeURIComponent(String(projectId));
    return this.request<GitLabPipeline>(`/projects/${encoded}/pipelines/${pipelineId}/cancel`, { method: 'POST' });
  }

  async deletePipeline(projectId: string | number, pipelineId: number): Promise<void> {
    const encoded = encodeURIComponent(String(projectId));
    await this.request<void>(`/projects/${encoded}/pipelines/${pipelineId}`, { method: 'DELETE' });
  }

  // ===========================================================================
  // Jobs
  // ===========================================================================

  async listPipelineJobs(projectId: string | number, pipelineId: number, params?: { scope?: string } & PaginationParams): Promise<PaginatedResponse<GitLabJob>> {
    const encoded = encodeURIComponent(String(projectId));
    const query = params ? this.buildQueryString(params) : '';
    return this.requestWithPagination<GitLabJob>(`/projects/${encoded}/pipelines/${pipelineId}/jobs${query ? `?${query}` : ''}`, params);
  }

  async getJob(projectId: string | number, jobId: number): Promise<GitLabJob> {
    const encoded = encodeURIComponent(String(projectId));
    return this.request<GitLabJob>(`/projects/${encoded}/jobs/${jobId}`);
  }

  async getJobLog(projectId: string | number, jobId: number): Promise<string> {
    const encoded = encodeURIComponent(String(projectId));
    const url = `${this.baseUrl}/projects/${encoded}/jobs/${jobId}/trace`;

    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new GitLabApiError(`Failed to get job log: ${response.status}`, response.status);
    }

    return response.text();
  }

  async retryJob(projectId: string | number, jobId: number): Promise<GitLabJob> {
    const encoded = encodeURIComponent(String(projectId));
    return this.request<GitLabJob>(`/projects/${encoded}/jobs/${jobId}/retry`, { method: 'POST' });
  }

  async cancelJob(projectId: string | number, jobId: number): Promise<GitLabJob> {
    const encoded = encodeURIComponent(String(projectId));
    return this.request<GitLabJob>(`/projects/${encoded}/jobs/${jobId}/cancel`, { method: 'POST' });
  }

  async playJob(projectId: string | number, jobId: number): Promise<GitLabJob> {
    const encoded = encodeURIComponent(String(projectId));
    return this.request<GitLabJob>(`/projects/${encoded}/jobs/${jobId}/play`, { method: 'POST' });
  }

  // ===========================================================================
  // Releases
  // ===========================================================================

  async listReleases(projectId: string | number, params?: PaginationParams): Promise<PaginatedResponse<GitLabRelease>> {
    const encoded = encodeURIComponent(String(projectId));
    return this.requestWithPagination<GitLabRelease>(`/projects/${encoded}/releases`, params);
  }

  async getRelease(projectId: string | number, tagName: string): Promise<GitLabRelease> {
    const projectEncoded = encodeURIComponent(String(projectId));
    const tagEncoded = encodeURIComponent(tagName);
    return this.request<GitLabRelease>(`/projects/${projectEncoded}/releases/${tagEncoded}`);
  }

  async createRelease(projectId: string | number, input: ReleaseCreateInput): Promise<GitLabRelease> {
    const encoded = encodeURIComponent(String(projectId));
    return this.request<GitLabRelease>(`/projects/${encoded}/releases`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateRelease(projectId: string | number, tagName: string, input: ReleaseUpdateInput): Promise<GitLabRelease> {
    const projectEncoded = encodeURIComponent(String(projectId));
    const tagEncoded = encodeURIComponent(tagName);
    return this.request<GitLabRelease>(`/projects/${projectEncoded}/releases/${tagEncoded}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  async deleteRelease(projectId: string | number, tagName: string): Promise<void> {
    const projectEncoded = encodeURIComponent(String(projectId));
    const tagEncoded = encodeURIComponent(tagName);
    await this.request<void>(`/projects/${projectEncoded}/releases/${tagEncoded}`, { method: 'DELETE' });
  }

  // ===========================================================================
  // Groups
  // ===========================================================================

  async listGroups(params?: { search?: string; owned?: boolean; visibility?: string; orderBy?: string; sort?: 'asc' | 'desc' } & PaginationParams): Promise<PaginatedResponse<GitLabGroup>> {
    const query = params ? this.buildQueryString(params) : '';
    return this.requestWithPagination<GitLabGroup>(`/groups${query ? `?${query}` : ''}`, params);
  }

  async getGroup(groupId: string | number): Promise<GitLabGroup> {
    const encoded = encodeURIComponent(String(groupId));
    return this.request<GitLabGroup>(`/groups/${encoded}`);
  }

  async createGroup(input: GroupCreateInput): Promise<GitLabGroup> {
    return this.request<GitLabGroup>('/groups', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateGroup(groupId: string | number, input: GroupUpdateInput): Promise<GitLabGroup> {
    const encoded = encodeURIComponent(String(groupId));
    return this.request<GitLabGroup>(`/groups/${encoded}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  async deleteGroup(groupId: string | number): Promise<void> {
    const encoded = encodeURIComponent(String(groupId));
    await this.request<void>(`/groups/${encoded}`, { method: 'DELETE' });
  }

  async listGroupProjects(groupId: string | number, params?: { search?: string; archived?: boolean } & PaginationParams): Promise<PaginatedResponse<GitLabProject>> {
    const encoded = encodeURIComponent(String(groupId));
    const query = params ? this.buildQueryString(params) : '';
    return this.requestWithPagination<GitLabProject>(`/groups/${encoded}/projects${query ? `?${query}` : ''}`, params);
  }

  // ===========================================================================
  // Users
  // ===========================================================================

  async listUsers(params?: { search?: string; username?: string; active?: boolean; blocked?: boolean } & PaginationParams): Promise<PaginatedResponse<GitLabUser>> {
    const query = params ? this.buildQueryString(params) : '';
    return this.requestWithPagination<GitLabUser>(`/users${query ? `?${query}` : ''}`, params);
  }

  async getUser(userId: number): Promise<GitLabUser> {
    return this.request<GitLabUser>(`/users/${userId}`);
  }

  // ===========================================================================
  // Members
  // ===========================================================================

  async listProjectMembers(projectId: string | number, params?: { search?: string } & PaginationParams): Promise<PaginatedResponse<GitLabMember>> {
    const encoded = encodeURIComponent(String(projectId));
    const query = params ? this.buildQueryString(params) : '';
    return this.requestWithPagination<GitLabMember>(`/projects/${encoded}/members${query ? `?${query}` : ''}`, params);
  }

  async addProjectMember(projectId: string | number, input: MemberAddInput): Promise<GitLabMember> {
    const encoded = encodeURIComponent(String(projectId));
    return this.request<GitLabMember>(`/projects/${encoded}/members`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateProjectMember(projectId: string | number, userId: number, input: MemberUpdateInput): Promise<GitLabMember> {
    const encoded = encodeURIComponent(String(projectId));
    return this.request<GitLabMember>(`/projects/${encoded}/members/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  async removeProjectMember(projectId: string | number, userId: number): Promise<void> {
    const encoded = encodeURIComponent(String(projectId));
    await this.request<void>(`/projects/${encoded}/members/${userId}`, { method: 'DELETE' });
  }

  // ===========================================================================
  // Variables
  // ===========================================================================

  async listProjectVariables(projectId: string | number, params?: PaginationParams): Promise<PaginatedResponse<GitLabVariable>> {
    const encoded = encodeURIComponent(String(projectId));
    return this.requestWithPagination<GitLabVariable>(`/projects/${encoded}/variables`, params);
  }

  async getProjectVariable(projectId: string | number, key: string): Promise<GitLabVariable> {
    const projectEncoded = encodeURIComponent(String(projectId));
    const keyEncoded = encodeURIComponent(key);
    return this.request<GitLabVariable>(`/projects/${projectEncoded}/variables/${keyEncoded}`);
  }

  async createProjectVariable(projectId: string | number, input: VariableCreateInput): Promise<GitLabVariable> {
    const encoded = encodeURIComponent(String(projectId));
    return this.request<GitLabVariable>(`/projects/${encoded}/variables`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async updateProjectVariable(projectId: string | number, key: string, input: VariableUpdateInput): Promise<GitLabVariable> {
    const projectEncoded = encodeURIComponent(String(projectId));
    const keyEncoded = encodeURIComponent(key);
    return this.request<GitLabVariable>(`/projects/${projectEncoded}/variables/${keyEncoded}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  }

  async deleteProjectVariable(projectId: string | number, key: string): Promise<void> {
    const projectEncoded = encodeURIComponent(String(projectId));
    const keyEncoded = encodeURIComponent(key);
    await this.request<void>(`/projects/${projectEncoded}/variables/${keyEncoded}`, { method: 'DELETE' });
  }

  // ===========================================================================
  // Webhooks
  // ===========================================================================

  async listProjectWebhooks(projectId: string | number, params?: PaginationParams): Promise<PaginatedResponse<GitLabWebhook>> {
    const encoded = encodeURIComponent(String(projectId));
    return this.requestWithPagination<GitLabWebhook>(`/projects/${encoded}/hooks`, params);
  }

  async createProjectWebhook(projectId: string | number, input: WebhookCreateInput): Promise<GitLabWebhook> {
    const encoded = encodeURIComponent(String(projectId));
    return this.request<GitLabWebhook>(`/projects/${encoded}/hooks`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async deleteProjectWebhook(projectId: string | number, hookId: number): Promise<void> {
    const encoded = encodeURIComponent(String(projectId));
    await this.request<void>(`/projects/${encoded}/hooks/${hookId}`, { method: 'DELETE' });
  }

  // ===========================================================================
  // Runners
  // ===========================================================================

  async listProjectRunners(projectId: string | number, params?: { status?: string; tagList?: string } & PaginationParams): Promise<PaginatedResponse<GitLabRunner>> {
    const encoded = encodeURIComponent(String(projectId));
    const query = params ? this.buildQueryString(params) : '';
    return this.requestWithPagination<GitLabRunner>(`/projects/${encoded}/runners${query ? `?${query}` : ''}`, params);
  }
}

// =============================================================================
// Factory Function
// =============================================================================

export function createGitLabClient(credentials: TenantCredentials): GitLabClient {
  return new GitLabClientImpl(credentials);
}
