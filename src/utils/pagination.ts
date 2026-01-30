/**
 * Pagination Utilities
 *
 * Helpers for handling GitLab API pagination.
 */

import type { PaginatedResponse, PaginationParams } from '../types/entities.js';

/**
 * Default pagination settings
 */
export const PAGINATION_DEFAULTS = {
  perPage: 20,
  maxPerPage: 100,
} as const;

/**
 * Normalize pagination parameters for GitLab API
 */
export function normalizePaginationParams(
  params?: PaginationParams,
  maxPerPage = PAGINATION_DEFAULTS.maxPerPage
): Required<Pick<PaginationParams, 'perPage'>> & Omit<PaginationParams, 'perPage'> {
  return {
    perPage: Math.min(params?.perPage || PAGINATION_DEFAULTS.perPage, maxPerPage),
    page: params?.page,
  };
}

/**
 * Create an empty paginated response
 */
export function emptyPaginatedResponse<T>(): PaginatedResponse<T> {
  return {
    items: [],
    count: 0,
    hasMore: false,
  };
}

/**
 * Create a paginated response from GitLab API response headers
 */
export function createPaginatedResponse<T>(
  items: T[],
  options: {
    total?: number;
    page?: number;
    totalPages?: number;
    nextPage?: number;
    hasMore?: boolean;
  } = {}
): PaginatedResponse<T> {
  return {
    items,
    count: items.length,
    total: options.total,
    page: options.page,
    totalPages: options.totalPages,
    nextPage: options.nextPage,
    hasMore: options.hasMore ?? (options.nextPage !== undefined),
  };
}

/**
 * Parse GitLab pagination headers
 */
export function parseGitLabPaginationHeaders(headers: Headers): {
  total?: number;
  totalPages?: number;
  page?: number;
  nextPage?: number;
  perPage?: number;
} {
  const total = headers.get('X-Total');
  const totalPages = headers.get('X-Total-Pages');
  const page = headers.get('X-Page');
  const nextPage = headers.get('X-Next-Page');
  const perPage = headers.get('X-Per-Page');

  return {
    total: total ? parseInt(total, 10) : undefined,
    totalPages: totalPages ? parseInt(totalPages, 10) : undefined,
    page: page ? parseInt(page, 10) : undefined,
    nextPage: nextPage ? parseInt(nextPage, 10) : undefined,
    perPage: perPage ? parseInt(perPage, 10) : undefined,
  };
}

/**
 * Calculate if there are more items based on page pagination
 */
export function hasMoreItems(page: number, totalPages: number): boolean {
  return page < totalPages;
}

/**
 * Calculate next page for page-based pagination
 */
export function getNextPage(
  currentPage: number,
  totalPages: number
): number | undefined {
  const next = currentPage + 1;
  return next <= totalPages ? next : undefined;
}
