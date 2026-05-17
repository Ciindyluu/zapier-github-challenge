# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Zapier CLI integration for the GitHub REST API that enables automated workflows between GitHub repositories and other tools. Built with Node.js 18+ using ES Modules, tested with Vitest, and deployed via Zapier Platform CLI.

**Core functionality:**
- **Trigger**: Detects new issues opened in a GitHub repository (polling-based)
- **Action**: Posts comments on existing GitHub issues
- **Auth**: API Key (GitHub Personal Access Token) with Bearer token injection

## Technology Stack

### Runtime & Package Management
- **Node.js**: Version 18 (specified in `.nvmrc`)
- **Package Manager**: npm (use `npm install`, not yarn or pnpm)
- **Module System**: ES Modules (ESM) — `"type": "module"` in package.json
  - All imports MUST include `.js` file extensions
  - JSON imports require: `import data from './file.json' with { type: 'json' }`
  - No `require()`, `__dirname`, or `__filename` (use `import.meta.url` if needed)


### Development Tools
- **Testing**: Vitest 4.1.6 + nock 14.0.15 (HTTP mocking)
- **Linting**: ESLint 8.57.1 with Airbnb base config + Prettier plugin
- **Formatting**: Prettier 3.8.3

## Code Style & Conventions

### Linting & Formatting

**ESLint** (`.eslintrc.json`):
- Extends: `airbnb-base` + `plugin:prettier/recommended`
- Environment: Node.js ES2021
- Key rules:
  - `import/extensions`: **Required** — all `.js` imports must include file extension
  - `no-console`: **Off** — console logging allowed for Zapier debugging
  - `import/prefer-default-export`: **Off** — named exports preferred
  - `consistent-return`: **Off** — flexible return patterns
  
**Prettier** (`.prettierrc.json`):
- Single quotes: `true`
- Semicolons: `true`
- Tab width: 2 spaces
- Print width: 100 characters
- Trailing commas: ES5 style
- Arrow function parens: `always`

### Naming Conventions

- **Files**: `camelCase.js` (e.g., `newIssue.js`, `createComment.js`)
- **Directories**: `lowercase` (e.g., `triggers`, `creates`, `utils`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `GITHUB_BASE_URL`)
- **Functions**: `camelCase` (e.g., `validateRepository`, `perform`)
- **Variables**: `camelCase`

### Import Style

```javascript
// Always include .js extension for local files
import { something } from './utils/validators.js';

// JSON imports require explicit type assertion
import packageJson from './package.json' with { type: 'json' };

// Named exports preferred over default exports
export const myFunction = () => {};
export { myFunction };
```

## Architecture & Organization

### Project Structure Philosophy

**Separation of Concerns**:
- **Business logic**: Lives in `src/triggers/`, `src/creates/` (each defines `perform` functions)
- **Configuration**: Lives in root-level files (`authentication.js`, `middleware.js`, `index.js`)
- **Shared utilities**: Lives in `src/utils/` (validation, helpers)
- **Constants**: Lives in `src/constants/` (API URLs, magic strings)
- **Tests**: Mirror the source structure in `src/test/`

**Where Each Type of File Lives**:
- `src/triggers/` — Polling triggers
- `src/creates/` — Actions that create/modify resources (POST/PATCH operations)
- `src/utils/` — Pure utility functions (validation, parsing, formatting)
- `src/constants/` — Hardcoded values, API endpoints, configuration constants
- `src/test/` — Test files (1:1 mapping with source files, same name + `.test.js`)

### Entry Point & Registration

[index.js](index.js) is the Zapier app entry point that:
- Imports and registers authentication, middleware, triggers, and actions
- Exports the app definition using `defineApp()` from `zapier-platform-core`
- Uses ES Module syntax with JSON import assertions for `package.json`

**Registration pattern**:
```javascript
import newIssue from './src/triggers/newIssue.js';
import createComment from './src/creates/createComment.js';

export default defineApp({
  version: packageJson.version,
  authentication,
  beforeRequest,
  afterResponse,
  triggers: {
    [newIssue.key]: newIssue,  // Key from trigger definition
  },
  creates: {
    [createComment.key]: createComment,
  },
});
```

### Authentication Flow

[authentication.js](authentication.js) defines a `custom` auth type:
- **Field**: `api_token` (password type, hidden input)
- **Test endpoint**: `GET /user` validates credentials on connection
- **Connection label**: Displays GitHub username (`{{login}}`)
- **Header injection**: Handled by `beforeRequest` middleware in [middleware.js](middleware.js)

### Middleware Architecture

[middleware.js](middleware.js) exports two middleware arrays:

**beforeRequest**: Runs before every API call
- Injects `Authorization: Bearer <token>` header
- Adds required GitHub headers (`Accept`, `X-GitHub-Api-Version`)
- Logs request method and URL

**afterResponse**: Runs after every API response
- Logs response status and GitHub rate limit info
- **Global error handling** by HTTP status:
  - `401` → Custom error (Authentication failed)
  - `404` → Custom error (repository/resource not found)
  - `403`/`429` → `ThrottledError` (rate limit exceeded, includes reset time)
  - `5xx` → Custom error (GitHub server error)

### Trigger: New Issue

[src/triggers/newIssue.js](src/triggers/newIssue.js)

**Polling logic:**
- Calls `GET /repos/{owner}/{repo}/issues` with params: `state=open`, `sort=created`, `direction=desc`, `per_page=25`
- **Filters out pull requests** (GitHub returns PRs mixed with issues)
- Deduplicates by `id` field

**Input fields:**
- `owner` and `repo` (required string inputs for repository identification)

### Action: Create Issue Comment

[src/creates/createComment.js](src/creates/createComment.js)

**API call:**
- Posts to `POST /repos/{owner}/{repo}/issues/{issue_number}/comments`
- Validates all inputs using [src/utils/validators.js](src/utils/validators.js)

**Input fields:**
- `owner`, `repo`, `issue_number`, `body` (supports Markdown)

### Validation Utilities

[src/utils/validators.js](src/utils/validators.js) provides input validation helpers:
- `validateRepository()`: Checks owner and repo are non-empty strings
- `validateIssueNumber()`: Ensures issue_number is positive integer
- `validateCommentBody()`: Ensures comment body is non-empty string

These throw Zapier-friendly errors that appear in the UI when validation fails.

### Constants

[src/constants/api.js](src/constants/api.js) exports:
- `GITHUB_BASE_URL`: API base URL (`https://api.github.com`)
- `GITHUB_DOMAIN`: Web domain (`github.com`)

Used consistently across authentication, triggers, and actions.

## Testing

### Framework & Tools
- **Test Runner**: Vitest 4.1.6
- **HTTP Mocking**: nock 14.0.15 (intercepts GitHub API calls)
- **Pattern**: All tests mock external HTTP calls — no real GitHub API requests

### Test File Conventions

**Location**: All tests live in [src/test/](src/test/)

**Naming**: `<source-file-name>.test.js`
- Source: `src/triggers/newIssue.js` → Test: `src/test/newIssue.test.js`
- Source: `authentication.js` → Test: `src/test/authentication.test.js`

**Structure**:
```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import nock from 'nock';
import { GITHUB_BASE_URL } from '../constants/api.js';

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup nock mocks
  });

  afterEach(() => {
    nock.cleanAll(); // Clean up after each test
  });

  it('should describe expected behavior', async () => {
    // Arrange: setup test data
    // Act: call the function
    // Assert: verify results
  });
});
```

### Test Coverage

**Current test files** in [src/test/](src/test/):
- `authentication.test.js` — Auth success/failure scenarios, credential validation
- `newIssue.test.js` — Trigger polling, PR filtering, deduplication
- `createComment.test.js` — Comment creation, input validation, error handling

### Running Tests
```bash
# Run all tests
npm test

# Run specific test file
npx vitest run src/test/newIssue.test.js

# Watch mode (re-run on file changes)
npx vitest
```

## Error Handling Strategy

### Global Middleware Approach

**All HTTP errors are handled in [middleware.js](middleware.js) `afterResponse` middleware**, NOT in individual trigger/action files. This ensures:
- Consistent error messages across all API calls
- Proper Zapier error types (RefreshAuthError, ThrottledError)
- No duplicate error handling logic

**Error handling by status code**:
- `401 Unauthorized` → `RefreshAuthError` (prompts user to reconnect)
- `404 Not Found` → Custom error with helpful message (repository/resource not found)
- `403 Forbidden` / `429 Too Many Requests` → `ThrottledError` (includes rate limit reset time)
- `5xx Server Error` → Custom error (GitHub server issue)

### Input Validation

**Validation happens at the start of `perform` functions** using utilities from [src/utils/validators.js](src/utils/validators.js):
```javascript
const perform = async (z, bundle) => {
  // Validate inputs FIRST
  validateRepository(bundle.inputData.owner, bundle.inputData.repo);
  validateIssueNumber(bundle.inputData.issue_number);
  
  // Then make API calls
  const response = await z.request(/* ... */);
  return response.data;
};
```

**Validators throw errors immediately** — Zapier catches these and shows them to users in the UI.

## Key Implementation Decisions & Constraints

### Polling vs Webhooks
**Decision**: Uses polling for simplicity.

**Why**: REST Hooks (webhooks) would require managing subscription/unsubscription lifecycle, storing webhook URLs, and handling GitHub webhook signature verification — significantly more complex for a v1 integration.

**Tradeoff**: Polling has a delay (Zapier polls every 5-15 minutes) vs instant webhook notifications.

### Pagination Limitation
**Constraint**: Fixed at `per_page: 25` for simplicity.

**Impact**: Very active repositories with >25 new issues between polls may miss some.

**Mitigation**: Sort by `created` descending to prioritize newest issues.

**Known enhancement**: Full pagination support (follow `Link` headers) is a future improvement.

### Pull Request Filtering
**Quirk**: GitHub's `/repos/{owner}/{repo}/issues` endpoint returns BOTH issues AND pull requests mixed together.

**Solution**: The `newIssue` trigger explicitly filters out PRs by checking for the `pull_request` field in each item.

**Why**: Users expect "New Issue" trigger to fire only for issues, not PRs.

### ESM Gotchas
**CRITICAL**: This project uses ES Modules (`"type": "module"`).

## Zapier-Specific Conventions

### App Definition Structure

Every trigger/action must export:
```javascript
export const key = 'unique_snake_case_key'; // Used as object key in index.js

export default {
  key: key,                    // Must match exported key constant
  noun: 'Issue',              // Singular noun (user-facing)
  display: {
    label: 'New Issue',       // User-facing name
    description: 'Triggers when...',
    important: true,          // Show in featured section
    hidden: false,            // Hide from trigger list (for dynamic dropdowns)
  },
  operation: {
    inputFields: [],          // User input configuration
    outputFields: [],         // Output data structure (optional)
    perform: performFunction, // Main logic
    sample: {},              // Example output for testing
  },
};
```

### Zapier Platform Core (`z` object)

The `z` object passed to `perform` functions provides:
- `z.request(options)` — HTTP client with auth injection (use instead of fetch/axios)
- `z.console.log()` — Logging visible in `zapier logs` (use instead of console.log in production)
- `z.JSON.parse()` — JSON parsing utilities
- `z.hash()` — Hashing utilities for deduplication

**Always use `z.request` for API calls** — it automatically:
- Injects authentication headers (via `beforeRequest` middleware)
- Applies error handling (via `afterResponse` middleware)
- Logs requests/responses

### Bundle Object

The `bundle` parameter contains:
- `bundle.inputData` — User inputs from `inputFields`
- `bundle.authData` — Authentication credentials (e.g., `bundle.authData.api_token`)
- `bundle.meta` — Zapier metadata (Zap ID, user timezone, etc.)

## Common Patterns & Workflows

### Adding a New Trigger
1. Create file in `src/triggers/` (e.g., `newLabel.js`)
2. Export a `key` constant and default object with required structure
3. Define `inputFields`, `outputFields`, `perform` function, and `sample` data
4. Import in [index.js](index.js):
   ```javascript
   import newLabel from './src/triggers/newLabel.js';
   ```
5. Register in `triggers` object:
   ```javascript
   triggers: {
     [newLabel.key]: newLabel,
   }
   ```
6. Create test file: `src/test/newLabel.test.js`

### Adding a New Action
1. Create file in `src/creates/` (e.g., `createIssue.js`)
2. Follow same export pattern as triggers
3. Add validation logic using utilities from `src/utils/validators.js`
4. Register in [index.js](index.js) `creates` object
5. Create test file: `src/test/createIssue.test.js`

### Adding Validation
1. Add helper function to [src/utils/validators.js](src/utils/validators.js):
   ```javascript
   export const validateTitle = (title) => {
     if (!title || typeof title !== 'string' || title.trim().length === 0) {
       throw new Error('Title is required and must be a non-empty string');
     }
   };
   ```
2. Import and call at the start of `perform` functions:
   ```javascript
   import { validateTitle } from '../utils/validators.js';
   
   const perform = async (z, bundle) => {
     validateTitle(bundle.inputData.title);
     // ... rest of logic
   };
   ```

### Adding a Constant
1. Add to [src/constants/api.js](src/constants/api.js):
   ```javascript
   export const GITHUB_API_VERSION = '2022-11-28';
   ```
2. Import where needed:
   ```javascript
   import { GITHUB_API_VERSION } from '../constants/api.js';
   ```

## Build & Deployment Process

### Pre-Deployment Checklist
1. **Format check**: `npm run format:check` (or `npm run format` to fix)
2. **Lint**: `npm run lint` (or `npm run lint:fix` to fix)
3. **Tests**: `npm test` (all tests must pass)
4. **Schema validation**: `zapier validate` (validates Zapier integration schema)

**One command**: `npm run build` runs all 4 steps in sequence.

### Deployment to Zapier
1. Authenticate (first time only): `zapier login`
2. Validate locally: `npm run build`
3. Push to Zapier: `zapier push`
4. Monitor logs: `zapier logs --type=http --detailed`

**Version management**: Each `zapier push` creates a new version. Users on older versions won't auto-update until they upgrade their Zaps.
