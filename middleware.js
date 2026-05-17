const addAuthHeaders = (request, z, bundle) => {
  request.headers.Authorization = `Bearer ${bundle.authData.api_token}`;
  request.headers.Accept = 'application/vnd.github+json';
  request.headers['X-GitHub-Api-Version'] = '2022-11-28';

  z.console.log(`[${request.method}] ${request.url}`);

  return request;
};

const logResponse = (response, z) => {
  z.console.log(`Response: ${response.status} ${response.statusText}`);

  // Log rate limit info if available
  if (response.headers) {
    const remaining = response.headers['x-ratelimit-remaining'];
    const limit = response.headers['x-ratelimit-limit'];
    if (remaining !== undefined && limit !== undefined) {
      z.console.log(`GitHub API Rate Limit: ${remaining}/${limit} remaining`);

      // Warn if getting close to rate limit
      if (parseInt(remaining, 10) < 100) {
        z.console.log(`⚠️  Warning: Only ${remaining} API calls remaining`);
      }
    }
  }

  return response;
};

const handleResponseErrors = (response, z) => {
  if (response.status >= 400) {
    const { status } = response;

    // Use Zapier's built-in error types for proper handling
    if (status === 401) {
      throw new z.errors.Error(
        'Authentication failed. Please check that your GitHub Personal Access Token is valid and has not expired.',
        'AuthenticationError',
        status
      );
    }

    if (status === 404) {
      throw new z.errors.Error(
        'Repository or resource not found. Please verify the repository owner and name are correct, and that you have access to this repository.',
        'NotFoundError',
        status
      );
    }

    if (status === 403 || status === 429) {
      const resetTime = response.headers?.['x-ratelimit-reset'];
      const resetDate = resetTime ? new Date(resetTime * 1000).toLocaleString() : 'soon';
      throw new z.errors.ThrottledError(
        `GitHub API rate limit exceeded. Your rate limit will reset at ${resetDate}. Please try again later.`
      );
    }

    if (status >= 500) {
      throw new z.errors.Error(
        'GitHub server error. Please try again later.',
        'ServerError',
        status
      );
    }

    // Generic error for other status codes
    throw new z.errors.Error(
      `GitHub API error: ${response.status} ${response.statusText}`,
      'APIError',
      response.status
    );

  }

  return response;
};

export const beforeRequest = [addAuthHeaders];
export const afterResponse = [logResponse, handleResponseErrors];

export default { beforeRequest, afterResponse };
