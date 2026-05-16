import { createAppTester } from 'zapier-platform-core';
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import nock from 'nock';

import App from '../../index.js';
import authentication from '../../authentication.js';

const appTester = createAppTester(App);

describe('GitHub PAT authentication', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  test('valid token authenticates successfully', async () => {
    // Mock the GitHub user API response
    nock('https://api.github.com')
      .get('/user')
      .reply(200, {
        login: 'testuser',
        id: 12345,
        node_id: 'MDQ6VXNlcjEyMzQ1',
        avatar_url: 'https://avatars.githubusercontent.com/u/12345',
        type: 'User',
        name: 'Test User',
        email: 'test@example.com'
      });

    const bundle = {
      authData: {
        api_token: 'valid-test-token',
      },
    };

    const response = await appTester(authentication.test, bundle);

    // When authentication.test is an object (not a function),
    // appTester returns the response data directly
    expect(response).toHaveProperty('login');
    expect(response.login).toBe('testuser');
  });

  test('fails on bad auth', async () => {
    // Mock the GitHub API to return 401 unauthorized
    nock('https://api.github.com')
      .get('/user')
      .reply(401, {
        message: 'Bad credentials',
        documentation_url: 'https://docs.github.com/rest'
      });

    const bundle = {
      authData: {
        api_token: 'bad-token',
      },
    };

    await expect(appTester(authentication.test, bundle)).rejects.toThrow();
  });
});
