import { describe, expect, test, beforeEach, afterEach } from 'vitest';
import nock from 'nock';
import { createAppTester } from 'zapier-platform-core';

import { GITHUB_BASE_URL, GITHUB_DOMAIN } from '../constants/api.js';
import App, { creates } from '../../index.js';
import { key } from '../creates/createComment.js';

const appTester = createAppTester(App);

describe('create_comment action', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  test('creates a comment on an issue', async () => {
    const commentBody = 'Automated test comment from Zapier integration — safe to delete.';

    // Mock the GitHub API response for creating a comment
    const mockCommentResponse = {
      id: 123456789,
      node_id: 'IC_kwDOABC1234567890',
      html_url: `https://${GITHUB_DOMAIN}/testuser/test-repo/issues/1#issuecomment-123456789`,
      body: commentBody,
      user: {
        login: 'testuser',
        id: 12345,
      },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    nock(GITHUB_BASE_URL)
      .post('/repos/testuser/test-repo/issues/1/comments', {
        body: commentBody,
      })
      .reply(201, mockCommentResponse);

    const bundle = {
      authData: { api_token: 'test-token' },
      inputData: {
        owner: 'testuser',
        repo: 'test-repo',
        issue_number: 1,
        body: commentBody,
      },
    };

    const result = await appTester(creates[key].operation.perform, bundle);

    expect(result).toHaveProperty('id');
    expect(result.id).toBe(123456789);
    expect(result).toHaveProperty('body', commentBody);
    expect(result).toHaveProperty('html_url');
    expect(result.html_url).toContain(GITHUB_DOMAIN);
  });

  test('handles API errors gracefully', async () => {
    // Mock the GitHub API to return 404 not found
    nock(GITHUB_BASE_URL)
      .post('/repos/testuser/test-repo/issues/999/comments')
      .reply(404, {
        message: 'Not Found',
        documentation_url: `https://docs.${GITHUB_DOMAIN}/rest/issues/comments#create-an-issue-comment`,
      });

    const bundle = {
      authData: { api_token: 'test-token' },
      inputData: {
        owner: 'testuser',
        repo: 'test-repo',
        issue_number: 999,
        body: 'Test comment',
      },
    };

    await expect(appTester(creates[key].operation.perform, bundle)).rejects.toThrow();
  });

  test('rejects empty string body', async () => {
    const bundle = {
      authData: { api_token: 'test-token' },
      inputData: {
        owner: 'testuser',
        repo: 'test-repo',
        issue_number: 1,
        body: '', // Empty body
      },
    };

    await expect(appTester(creates[key].operation.perform, bundle)).rejects.toThrow(
      'Missing required fields: body'
    );
  });

  test('rejects whitespace-only body', async () => {
    const bundle = {
      authData: { api_token: 'test-token' },
      inputData: {
        owner: 'testuser',
        repo: 'test-repo',
        issue_number: 1,
        body: '   \n  \t  ', // Whitespace-only body
      },
    };

    await expect(appTester(creates[key].operation.perform, bundle)).rejects.toThrow(
      'Missing required fields: body'
    );
  });
});
