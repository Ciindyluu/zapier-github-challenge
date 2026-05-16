/**
 * Validation utilities for GitHub API integration
 *
 * Note: HTTP error handling is centralized in middleware.js
 * These functions only validate business logic and input formats
 */

/**
 * Validates repository format (owner/repo)
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {Object} z - Zapier's z object
 * @throws {Error} If validation fails
 */
export const validateRepository = (owner, repo, z) => {
  // GitHub username/org rules: 1-39 chars, alphanumeric + hyphens, no consecutive hyphens
  const ownerRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
  // GitHub repo rules: alphanumeric + hyphens, underscores, dots
  const repoRegex = /^[a-zA-Z0-9._-]+$/;

  if (!ownerRegex.test(owner)) {
    throw new z.errors.Error(
      `Invalid repository owner: "${owner}". Must be 1-39 characters, alphanumeric with hyphens, and cannot have consecutive hyphens.`,
      'ValidationError',
      400
    );
  }

  if (!repoRegex.test(repo)) {
    throw new z.errors.Error(
      `Invalid repository name: "${repo}". Must contain only alphanumeric characters, hyphens, underscores, and dots.`,
      'ValidationError',
      400
    );
  }
};

/**
 * Validates issue number
 * @param {number} issueNumber - Issue number to validate
 * @param {Object} z - Zapier's z object
 * @throws {Error} If validation fails
 */
export const validateIssueNumber = (issueNumber, z) => {
  const num = parseInt(issueNumber, 10);

  if (Number.isNaN(num) || num <= 0 || !Number.isInteger(num)) {
    throw new z.errors.Error(
      `Invalid issue number: "${issueNumber}". Must be a positive integer.`,
      'ValidationError',
      400
    );
  }
};

/**
 * Validates comment body is not empty or whitespace-only
 * @param {string} body - Comment body to validate
 * @param {Object} z - Zapier's z object
 * @throws {Error} If validation fails
 */
export const validateCommentBody = (body, z) => {
  if (!body || (typeof body === 'string' && body.trim() === '')) {
    throw new z.errors.Error(
      'Missing required fields: body. Please provide all required information.',
      'ValidationError',
      400
    );
  }
};
