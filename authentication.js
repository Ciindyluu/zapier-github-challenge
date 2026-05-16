export const authentication = {
  type: 'custom',
  fields: [
    {
      key: 'api_token',
      label: 'GitHub Personal Access Token',
      required: true,
      type: 'password',
      helpText:
        'Generate a PAT at github.com → Settings → Developer settings → Personal access tokens. Requires `repo` scope.',
    },
  ],
  test: {
    url: 'https://api.github.com/user',
    method: 'GET',
  },
  connectionLabel: '{{login}}',
};

export default authentication;
