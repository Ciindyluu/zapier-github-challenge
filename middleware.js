const addAuthHeaders = (request, z, bundle) => {
  request.headers['Authorization'] = `Bearer ${bundle.authData.api_token}`;
  request.headers['Accept'] = 'application/vnd.github+json';
  request.headers['X-GitHub-Api-Version'] = '2022-11-28';

  // Log outgoing requests for debugging
  z.console.log(`[${request.method}] ${request.url}`);

  return request;
};

const logResponse = (response, z) => {
  // Log response status for debugging
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

export const beforeRequest = [addAuthHeaders];
export const afterResponse = [logResponse];

export default { beforeRequest, afterResponse };

