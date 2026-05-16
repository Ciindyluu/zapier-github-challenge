import { GITHUB_BASE_URL, GITHUB_DOMAIN } from '../constants/api.js';
import { validateRepository } from '../utils/validators.js';

const getIssues = async (z, bundle) => {
  validateRepository(bundle.inputData.owner, bundle.inputData.repo, z);

  const response = await z.request({
    url: `${GITHUB_BASE_URL}/repos/${bundle.inputData.owner}/${bundle.inputData.repo}/issues`,
    params: {
      state: 'open',
      sort: 'created',
      direction: 'desc',
      per_page: 25,
    },
  });

  // GitHub returns PRs in the issues endpoint, filter them out
  const issues = response.data.filter((issue) => !issue.pull_request);

  z.console.log(
    `Fetched ${issues.length} issues from ${bundle.inputData.owner}/${bundle.inputData.repo}`
  );

  return issues;
};

export const key = 'new_issue';

export default {
  key,
  noun: 'Issue',

  display: {
    label: 'New Issue',
    description: 'Triggers when a new issue is opened in a GitHub repository.',
  },

  operation: {
    inputFields: [
      {
        key: 'owner',
        label: 'Repository Owner',
        type: 'string',
        required: true,
        helpText: 'The GitHub username or organization that owns the repository.',
      },
      {
        key: 'repo',
        label: 'Repository Name',
        type: 'string',
        required: true,
        helpText: 'The name of the repository (e.g. my-project).',
      },
    ],
    outputFields: [
      { key: 'id', label: 'Issue ID', type: 'integer' },
      { key: 'number', label: 'Issue Number', type: 'integer' },
      { key: 'title', label: 'Issue Title', type: 'string' },
      { key: 'body', label: 'Issue Body', type: 'string' },
      { key: 'state', label: 'State', type: 'string' },
      { key: 'html_url', label: 'Issue URL', type: 'string' },
      { key: 'user__login', label: 'Author Username', type: 'string' },
      { key: 'created_at', label: 'Created At', type: 'datetime' },
      { key: 'updated_at', label: 'Updated At', type: 'datetime' },
    ],
    perform: getIssues,
    sample: {
      id: 1,
      number: 1,
      title: 'Sample Issue',
      body: 'This is a sample issue body.',
      state: 'open',
      html_url: `https://${GITHUB_DOMAIN}/owner/repo/issues/1`,
      user: { login: 'octocat' },
      created_at: '2024-01-01T00:00:00Z',
    },
  },
};
