# GitLab MCP Server

[![Primrose MCP](https://img.shields.io/badge/Primrose-MCP-blue)](https://primrose.dev/mcp/gitlab)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A Model Context Protocol (MCP) server for GitLab, enabling AI assistants to manage projects, merge requests, issues, pipelines, and collaborate on code.

## Features

- **Projects** - Project management and settings
- **Repository** - Repository files and commits
- **Merge Requests** - MR creation, review, and merging
- **Issues** - Issue tracking and management
- **Pipelines** - CI/CD pipeline management
- **Groups** - Group and subgroup management
- **Users** - User information and management

## Quick Start

The recommended way to use this MCP server is through the Primrose SDK:

```bash
npm install primrose-mcp
```

```typescript
import { PrimroseMCP } from 'primrose-mcp';

const primrose = new PrimroseMCP({
  service: 'gitlab',
  headers: {
    'X-GitLab-Token': 'your-personal-access-token'
  }
});
```

## Manual Installation

If you prefer to run the MCP server directly:

```bash
# Clone the repository
git clone https://github.com/primrose-ai/primrose-mcp-gitlab.git
cd primrose-mcp-gitlab

# Install dependencies
npm install

# Run locally
npm run dev
```

## Configuration

### Required Headers (one of)

| Header | Description |
|--------|-------------|
| `X-GitLab-Token` | GitLab Personal Access Token |
| `X-GitLab-Access-Token` | OAuth access token |

### Optional Headers

| Header | Description |
|--------|-------------|
| `X-GitLab-Base-URL` | Override the default GitLab API base URL (for self-hosted GitLab instances). Default: https://gitlab.com |

## Available Tools

### Project Tools
- Create, update, and delete projects
- Project settings management
- Fork projects
- Star/unstar projects

### Repository Tools
- File operations (read, create, update, delete)
- Branch management
- Commit history
- Compare branches
- Repository tree

### Merge Request Tools
- Create and manage merge requests
- Review and approve MRs
- Merge operations
- MR comments and discussions

### Issue Tools
- Create and update issues
- Label management
- Milestone management
- Issue assignment
- Issue notes

### Pipeline Tools
- View pipeline status
- Trigger pipelines
- Pipeline jobs
- Job artifacts
- Retry/cancel jobs

### Group Tools
- Group creation and management
- Subgroup management
- Group members
- Group projects

### User Tools
- User information
- Current user details
- User activities

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Related Resources

- [Primrose SDK Documentation](https://primrose.dev/docs)
- [GitLab REST API Documentation](https://docs.gitlab.com/ee/api/)
- [GitLab Developer Documentation](https://docs.gitlab.com/ee/development/)
- [Model Context Protocol](https://modelcontextprotocol.io)

## License

MIT
