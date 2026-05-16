import { GITHUB_BASE_URL, GITHUB_DOMAIN } from '../constants/api.js';
import {
  validateRepository,
  validateIssueNumber,
  validateCommentBody,
} from '../utils/validators.js';

const createComment = async (z, bundle) => {
  validateRepository(bundle.inputData.owner, bundle.inputData.repo, z);
  validateIssueNumber(bundle.inputData.issue_number, z);
  validateCommentBody(bundle.inputData.body, z);

  const response = await z.request({
    url: `${GITHUB_BASE_URL}/repos/${bundle.inputData.owner}/${bundle.inputData.repo}/issues/${bundle.inputData.issue_number}/comments`,
    method: 'POST',
    body: {
      body: bundle.inputData.body,
    },
  });

  z.console.log(
    `Created comment on issue #${bundle.inputData.issue_number} in ${bundle.inputData.owner}/${bundle.inputData.repo}`
  );

  return response.data;
};

export const key = 'create_comment';

export default {
  key,
  noun: 'Comment',

  display: {
    label: 'Create Issue Comment',
    description: 'Posts a comment on an existing GitHub issue.',
  },

  operation: {
    inputFields: [
      {
        key: 'owner',
        label: 'Repository Owner',
        type: 'string',
        required: true,
        helpText: 'The username or organization that owns the repository.',
      },
      {
        key: 'repo',
        label: 'Repository Name',
        type: 'string',
        required: true,
        helpText: 'The name of the repository.',
      },
      {
        key: 'issue_number',
        label: 'Issue Number',
        type: 'integer',
        required: true,
        helpText: 'The number of the issue to comment on (e.g. 42).',
      },
      {
        key: 'body',
        label: 'Comment Body',
        type: 'text',
        required: true,
        helpText: 'The text content of the comment. Supports Markdown.',
      },
    ],
    outputFields: [
      { key: 'id', label: 'Comment ID', type: 'integer' },
      { key: 'body', label: 'Comment Body', type: 'string' },
      { key: 'html_url', label: 'Comment URL', type: 'string' },
      { key: 'user__login', label: 'Author Username', type: 'string' },
      { key: 'created_at', label: 'Created At', type: 'datetime' },
      { key: 'updated_at', label: 'Updated At', type: 'datetime' },
    ],
    perform: createComment,
    sample: {
      id: 1,
      body: 'This is a sample comment.',
      html_url: `https://${GITHUB_DOMAIN}/owner/repo/issues/1#issuecomment-1`,
      user: { login: 'octocat' },
      created_at: '2024-01-01T00:00:00Z',
    },
  },
};
