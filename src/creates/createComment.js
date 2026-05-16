import { handleErrors, validateInputs, validateRepository, validateIssueNumber } from '../utils/errorHandler.js';

const createCommentImpl = async (z, bundle) => {
    // Validate required inputs
    validateInputs(bundle.inputData, ['owner', 'repo', 'issue_number', 'body'], z);
    validateRepository(bundle.inputData.owner, bundle.inputData.repo, z);
    validateIssueNumber(bundle.inputData.issue_number, z);

    const response = await z.request({
        url: `https://api.github.com/repos/${bundle.inputData.owner}/${bundle.inputData.repo}/issues/${bundle.inputData.issue_number}/comments`,
        method: 'POST',
        body: {
            body: bundle.inputData.body,
        },
    });

    z.console.log(`Created comment on issue #${bundle.inputData.issue_number} in ${bundle.inputData.owner}/${bundle.inputData.repo}`);

    return response.data;
};

const createComment = handleErrors(createCommentImpl);

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
        perform: createComment,
        sample: {
            id: 1,
            body: 'This is a sample comment.',
            html_url: 'https://github.com/owner/repo/issues/1#issuecomment-1',
            user: { login: 'octocat' },
            created_at: '2024-01-01T00:00:00Z',
        },
    },
};