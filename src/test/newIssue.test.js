import { describe, expect, test, beforeEach, afterEach } from 'vitest';
import nock from 'nock';
import { createAppTester } from 'zapier-platform-core';

import { GITHUB_BASE_URL, GITHUB_DOMAIN } from '../constants/api.js';
import App, { triggers } from '../../index.js';
import { key } from '../triggers/newIssue.js';

const appTester = createAppTester(App);

describe('new_issue trigger', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  test('returns a list of issues', async () => {
    // Mock GitHub API response with sample issues
    const mockIssues = [
      {
        id: 1,
        number: 1,
        title: 'Found a bug',
        state: 'open',
        html_url: `https://${GITHUB_DOMAIN}/octocat/Hello-World/issues/1`,
        body: 'Issue description',
        created_at: '2024-01-01T00:00:00Z',
        user: {
          login: 'octocat',
          id: 1,
        },
      },
      {
        id: 2,
        number: 2,
        title: 'Feature request',
        state: 'open',
        html_url: `https://${GITHUB_DOMAIN}/octocat/Hello-World/issues/2`,
        body: 'Feature description',
        created_at: '2024-01-02T00:00:00Z',
        user: {
          login: 'testuser',
          id: 2,
        },
      },
      // Include a PR to test filtering
      {
        id: 3,
        number: 3,
        title: 'Pull request',
        state: 'open',
        html_url: `https://${GITHUB_DOMAIN}/octocat/Hello-World/pull/3`,
        body: 'PR description',
        created_at: '2024-01-03T00:00:00Z',
        pull_request: {
          url: `https://${GITHUB_BASE_URL}/repos/octocat/Hello-World/pulls/3`,
        },
        user: {
          login: 'contributor',
          id: 3,
        },
      },
    ];

    nock(GITHUB_BASE_URL)
      .get('/repos/octocat/Hello-World/issues')
      .query({ state: 'open', sort: 'created', direction: 'desc', per_page: 25 })
      .reply(200, mockIssues);

    const bundle = {
      authData: { api_token: 'test-token' },
      inputData: {
        owner: 'octocat',
        repo: 'Hello-World',
      },
    };

    const results = await appTester(triggers[key].operation.perform, bundle);

    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0]).toHaveProperty('id');
    expect(results[0]).toHaveProperty('title');
    expect(results[0]).toHaveProperty('number');

    // Confirms PR filter works - no results should have pull_request property
    results.forEach((issue) => {
      expect(issue).not.toHaveProperty('pull_request');
    });
  });

  test('filters out pull requests from results', async () => {
    // Mock response with only pull requests
    const mockPullRequests = [
      {
        id: 1,
        number: 1,
        title: 'Pull request 1',
        state: 'open',
        html_url: `https://${GITHUB_DOMAIN}/octocat/Hello-World/pull/1`,
        body: 'PR description',
        created_at: '2024-01-01T00:00:00Z',
        pull_request: {
          url: `https://${GITHUB_BASE_URL}/repos/octocat/Hello-World/pulls/1`,
        },
        user: {
          login: 'contributor',
          id: 1,
        },
      },
    ];

    nock(GITHUB_BASE_URL)
      .get('/repos/octocat/Hello-World/issues')
      .query({ state: 'open', sort: 'created', direction: 'desc', per_page: 25 })
      .reply(200, mockPullRequests);

    const bundle = {
      authData: { api_token: 'test-token' },
      inputData: {
        owner: 'octocat',
        repo: 'Hello-World',
      },
    };

    const results = await appTester(triggers[key].operation.perform, bundle);

    // Should return empty array since all items are pull requests
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });
});
