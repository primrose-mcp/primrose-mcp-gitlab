/**
 * Environment Bindings
 *
 * Type definitions for Cloudflare Worker environment variables and bindings.
 *
 * MULTI-TENANT ARCHITECTURE:
 * This server supports multiple tenants. Tenant-specific credentials (API keys,
 * OAuth tokens, etc.) are passed via request headers, NOT stored in wrangler
 * secrets. This allows a single server instance to serve multiple customers.
 *
 * Request Headers:
 * - X-GitLab-Token: GitLab Personal Access Token
 * - X-GitLab-Access-Token: OAuth access token
 * - X-GitLab-Base-URL: (Optional) Override the default GitLab API base URL
 */

// =============================================================================
// Tenant Credentials (parsed from request headers)
// =============================================================================

export interface TenantCredentials {
  /** Personal Access Token for GitLab authentication (from X-GitLab-Token header) */
  privateToken?: string;

  /** Override GitLab API base URL (from X-GitLab-Base-URL header) */
  baseUrl?: string;

  /** OAuth Access Token (from X-GitLab-Access-Token header) */
  accessToken?: string;
}

/**
 * Parse tenant credentials from request headers
 */
export function parseTenantCredentials(request: Request): TenantCredentials {
  const headers = request.headers;

  return {
    privateToken: headers.get('X-GitLab-Token') || undefined,
    baseUrl: headers.get('X-GitLab-Base-URL') || undefined,
    accessToken: headers.get('X-GitLab-Access-Token') || undefined,
  };
}

/**
 * Validate that required credentials are present
 */
export function validateCredentials(credentials: TenantCredentials): void {
  if (!credentials.privateToken && !credentials.accessToken) {
    throw new Error(
      'Missing credentials. Provide either X-GitLab-Token or X-GitLab-Access-Token header.'
    );
  }
}

// =============================================================================
// Environment Configuration (from wrangler.jsonc vars and bindings)
// =============================================================================

export interface Env {
  // ===========================================================================
  // Environment Variables (from wrangler.jsonc vars)
  // ===========================================================================

  /** Maximum character limit for responses */
  CHARACTER_LIMIT: string;

  /** Default page size for list operations */
  DEFAULT_PAGE_SIZE: string;

  /** Maximum page size allowed */
  MAX_PAGE_SIZE: string;

  // ===========================================================================
  // Bindings
  // ===========================================================================

  /** KV namespace for OAuth token storage */
  OAUTH_KV?: KVNamespace;

  /** Durable Object namespace for MCP sessions */
  MCP_SESSIONS?: DurableObjectNamespace;

  /** Cloudflare AI binding (optional) */
  AI?: Ai;
}

// ===========================================================================
// Helper Functions
// ===========================================================================

/**
 * Get a numeric environment value with a default
 */
export function getEnvNumber(env: Env, key: keyof Env, defaultValue: number): number {
  const value = env[key];
  if (typeof value === 'string') {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

/**
 * Get the character limit from environment
 */
export function getCharacterLimit(env: Env): number {
  return getEnvNumber(env, 'CHARACTER_LIMIT', 50000);
}

/**
 * Get the default page size from environment
 */
export function getDefaultPageSize(env: Env): number {
  return getEnvNumber(env, 'DEFAULT_PAGE_SIZE', 20);
}

/**
 * Get the maximum page size from environment
 */
export function getMaxPageSize(env: Env): number {
  return getEnvNumber(env, 'MAX_PAGE_SIZE', 100);
}
