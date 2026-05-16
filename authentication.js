import { GITHUB_BASE_URL, GITHUB_DOMAIN } from './src/constants/api.js';

export const authentication = {
  type: 'custom',
  fields: [
    {
      key: 'api_token',
      label: 'GitHub Personal Access Token',
      required: true,
      type: 'password',
      helpText:
        `Generate a PAT at ${GITHUB_DOMAIN} → Settings → Developer settings → Personal access tokens. Requires \`repo\` scope.`,
    },
  ],
  // Zapier tests auth by calling this endpoint when user connects their account
  test: {
    url: `${GITHUB_BASE_URL}/user`,
    method: 'GET',
  },
  // Display username in Zapier UI using the 'login' field from test response
  connectionLabel: '{{login}}',
};

export default authentication;
