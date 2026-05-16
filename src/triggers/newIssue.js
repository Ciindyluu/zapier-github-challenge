import { GITHUB_BASE_URL, GITHUB_DOMAIN } from '../constants/api.js';
import { handleErrors, validateInputs, validateRepository } from '../utils/errorHandler.js';

const getIssuesImpl = async (z, bundle) => {
    validateInputs(bundle.inputData, ['owner', 'repo'], z);
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

    z.console.log(`Fetched ${issues.length} issues from ${bundle.inputData.owner}/${bundle.inputData.repo}`);

    return issues;
};

const getIssues = handleErrors(getIssuesImpl);

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
