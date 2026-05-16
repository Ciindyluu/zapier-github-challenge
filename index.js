import zapier, { defineApp } from 'zapier-platform-core';
import packageJson from './package.json' with { type: 'json' };

import authentication from './authentication.js';
import { beforeRequest, afterResponse } from './middleware.js';
import newIssue, { key as newIssueKey } from './src/triggers/newIssue.js';
import createComment, { key as createCommentKey } from './src/creates/createComment.js';

const App = defineApp({
  version: packageJson.version,
  platformVersion: zapier.version,

  authentication,
  beforeRequest: [...beforeRequest],
  afterResponse: [...afterResponse],

  // Add your triggers here for them to show up!
  triggers: {
    [newIssueKey]: newIssue,
  },

  // Add your creates here for them to show up!
  creates: {
    [createCommentKey]: createComment
  },
});

// Export triggers and creates for testing
export const triggers = App.triggers;
export const creates = App.creates;

export default App;