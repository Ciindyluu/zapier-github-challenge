/**
 * Error handling utilities for GitHub API integration
 */

/**
 * Wraps API calls with error handling and provides user-friendly error messages
 * @param {Function} fn - The async function to execute
 * @param {Object} z - Zapier's z object
 * @returns {Function} Wrapped function with error handling
 */
export const handleErrors = (fn) => {
  return async (z, bundle) => {
    try {
      return await fn(z, bundle);
    } catch (error) {
      if (error.response) {
        const { status } = error.response;

        switch (status) {
          case 401:
            throw new z.errors.Error(
              'Authentication failed. Please check that your GitHub Personal Access Token is valid and has not expired.',
              'AuthenticationError',
              status
            );

          case 404:
            throw new z.errors.Error(
              'Repository or resource not found. Please verify the repository owner and name are correct, and that you have access to this repository.',
              'NotFoundError',
              status
            );

          case 429: {
            const resetTime = error.response.headers?.['x-ratelimit-reset'];
            const resetDate = resetTime ? new Date(resetTime * 1000).toLocaleString() : 'soon';
            throw new z.errors.Error(
              `GitHub API rate limit exceeded. Your rate limit will reset at ${resetDate}. Please try again later.`,
              'RateLimitError',
              status
            );
          }

          default:
            throw error;
        }
      }

      throw error;
    }
  };
};

/**
 * Validates required input fields
 * @param {Object} inputData - The input data to validate
 * @param {Array<string>} requiredFields - Array of required field names
 * @param {Object} z - Zapier's z object
 * @throws {Error} If validation fails
 */
export const validateInputs = (inputData, requiredFields, z) => {
  const missing = requiredFields.filter(
    (field) =>
      !inputData[field] || (typeof inputData[field] === 'string' && inputData[field].trim() === '')
  );

  if (missing.length > 0) {
    throw new z.errors.Error(
      `Missing required fields: ${missing.join(', ')}. Please provide all required information.`,
      'ValidationError',
      400
    );
  }
};

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
