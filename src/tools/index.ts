/**
 * GitLab MCP Tools Index
 *
 * Exports all tool definitions and handlers for GitLab MCP tools.
 */

// Export tool definitions
export { projectTools, handleProjectTool } from './projects.js';
export { repositoryTools, handleRepositoryTool } from './repository.js';
export { mergeRequestTools, handleMergeRequestTool } from './merge-requests.js';
export { issueTools, handleIssueTool } from './issues.js';
export { pipelineTools, handlePipelineTool } from './pipelines.js';
export { groupTools, handleGroupTool } from './groups.js';
export { userTools, handleUserTool } from './users.js';

// Import all tool arrays for aggregation
import { projectTools } from './projects.js';
import { repositoryTools } from './repository.js';
import { mergeRequestTools } from './merge-requests.js';
import { issueTools } from './issues.js';
import { pipelineTools } from './pipelines.js';
import { groupTools } from './groups.js';
import { userTools } from './users.js';

/**
 * All GitLab MCP tools combined
 */
export const allTools = [
  ...userTools,
  ...projectTools,
  ...groupTools,
  ...repositoryTools,
  ...mergeRequestTools,
  ...issueTools,
  ...pipelineTools,
];
