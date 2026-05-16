# Zapier and GitHub Integration

Zapier integration for the GitHub REST API using API Key authentication and middleware-based error handling. Built with Node.js and tested with Vitest.

---

## Overview

### GitHub API Integration

- **API**: [GitHub REST API v3](https://docs.github.com/en/rest)
- **About GitHub**: GitHub is a cloud-based platform for version control and collaboration, widely used by developers and teams to manage source code and project workflows.
- **Integration Focus**: Enables automated workflows between GitHub repositories and other tools through Zapier.

### Use Cases

**1. Trigger**: New Issue

- Detects when a new issue is opened in a GitHub repository
- Enables downstream automation such as notifications, task creation, or team alerts
- Example: Automatically notify a Slack channel or create a task in a project management tool when a new issue is reported

**2. Action**: Create Issue Comment

- Posts a comment on an existing GitHub issue
- Enables automated responses or status updates based on external triggers
- Example: Automatically acknowledge a new issue with a confirmation message

---

## Quick Start

### Prerequisites

- **Node.js v18+** (required by Zapier Platform Core 18.6.0)
- npm
- Zapier CLI installed globally: `npm install -g zapier-platform-cli`

Check your Node version:

```bash
node --version  # Should be v18.0.0 or higher
```

### Installation

1. **Install dependencies**:

```bash
npm install
```

2. **Run tests** to verify setup:

```bash
npm test
```

3. **Validate the integration**:

```bash
zapier validate
```

4. **Deploy to Zapier**:

```bash
zapier push
```

---

## Development

### Scripts

- `npm run build` — full validation (format check, lint, test, zapier validate)
- `npm test` — runs the test suite
- `npm run lint` / `npm run lint:fix` — runs ESLint
- `npm run format` / `npm run format:check` — runs Prettier

### Project Structure

```
github-zapier-challenge/
├── index.js                         # App entry point — registers auth, triggers, actions, middleware
├── authentication.js                # Authentication configuration
├── middleware.js                    # Request/response middleware with error handling
├── package.json                     # Project dependencies and scripts
├── package-lock.json                # Locked dependency versions
├── src/
│   ├── constants/
│   │   └── api.js                  # GitHub API base URL constants
│   ├── triggers/
│   │   └── newIssue.js             # New Issue polling trigger
│   ├── creates/
│   │   └── createComment.js        # Create Issue Comment action
│   ├── utils/
│   │   └── validators.js           # Input validation utilities
│   └── test/
│       ├── authentication.test.js  # Authentication tests
│       ├── newIssue.test.js        # Trigger tests
│       └── createComment.test.js   # Action tests
├── .gitignore                       # Files to exclude from version control
├── .eslintrc.json                   # ESLint configuration
├── .eslintignore                    # ESLint ignore patterns
├── .prettierrc.json                 # Prettier formatting configuration
├── .prettierignore                  # Prettier ignore patterns
└── README.md                        # Project documentation
```

### Tests

- **Framework**: Vitest
- **Location**: [src/test/](src/test/)
- **Coverage**:
  - Authentication: valid token success, invalid token rejection
  - New Issue trigger: returns issue list, filters out pull requests
  - Create Comment action: successfully posts a comment, response shape validation

Run tests:

```bash
npm test
```

---

## Technical Details

### Implementation Overview

#### Stack

Zapier CLI + Node.js, Vitest, ESLint + Prettier

#### Module System

This project uses **ES Modules (ESM)** via `"type": "module"` in [package.json](package.json). All files use `import`/`export` syntax. This affects:

- Import statements must include file extensions (e.g., `import { foo } from './utils.js'`)
- `__dirname` and `__filename` are not available (use `import.meta.url` if needed)
- JSON imports require assertions: `import data from './file.json' assert { type: 'json' }`

#### Auth

API Key (Custom), injected as `Authorization: Bearer <token>` via `beforeRequest` middleware

#### Trigger

_New Issue_ — polls `GET /repos/{owner}/{repo}/issues` and deduplicates by `id`

#### Action

_Create Issue Comment_ — posts a comment via `POST /repos/{owner}/{repo}/issues/{issue_number}/comments`

#### Goal

Deliver a minimal but functional integration that authenticates, detects new issues via polling, and posts comments — passing `zapier validate` and supporting end-to-end Zap testing after `zapier push`.

### Authentication

#### Type

Custom (`type: 'custom'`)

#### Required Field

`api_token` (password type, hidden input)

#### Header

`Authorization: Bearer <api_token>` — injected globally via `beforeRequest` middleware

#### Test Endpoint

`GET https://api.github.com/user`

#### Connection Label

`{{login}}`

### Middleware

Located in [middleware.js](middleware.js) as `beforeRequest` and `afterResponse` and imported into [index.js](index.js):

#### beforeRequest

Injects the `Authorization` header and sets required GitHub API headers (`Accept`, `X-GitHub-Api-Version`) on every request.

#### afterResponse

Logs API responses with rate limit information and handles HTTP errors globally:

- `401` — throws `RefreshAuthError` (invalid or expired token)
- `404` — throws `Error` with NotFoundError type (resource not found)
- `403` / `429` — throws `ThrottledError` (rate limit exceeded, includes reset time)
- `5xx` — throws `Error` with ServerError type (GitHub server error)

### Trigger — New Issue

#### File

[src/triggers/newIssue.js](src/triggers/newIssue.js)

#### Description

Polls `GET /repos/{owner}/{repo}/issues` to detect newly opened issues. Pull requests are filtered out from results. Returns newest issues first.

#### Input Fields

- `owner` (string, required) — GitHub username or organization
- `repo` (string, required) — repository name

#### Deduplication

by `id`

#### Sample Output

```json
{
  "id": 1,
  "number": 1,
  "title": "Sample Issue",
  "body": "Issue description here.",
  "state": "open",
  "html_url": "https://github.com/owner/repo/issues/1",
  "user": { "login": "octocat" },
  "created_at": "2024-01-01T00:00:00Z"
}
```

### Action — Create Issue Comment

#### File

[src/creates/createComment.js](src/creates/createComment.js)

#### Description

Posts a comment on an existing issue via `POST /repos/{owner}/{repo}/issues/{issue_number}/comments`.

#### Input Fields

- `owner` (string, required) — GitHub username or organization
- `repo` (string, required) — repository name
- `issue_number` (integer, required) — the issue to comment on
- `body` (text, required) — comment content, supports Markdown

#### Sample Output

```json
{
  "id": 1,
  "body": "This is a sample comment.",
  "html_url": "https://github.com/owner/repo/issues/1#issuecomment-1",
  "user": { "login": "octocat" },
  "created_at": "2024-01-01T00:00:00Z"
}
```

---

## Usage

### Authentication Setup

When creating a Zap, you'll be prompted to authenticate:

1. Enter your GitHub Personal Access Token
2. The integration tests the connection using `GET /user`
3. Your connection label will display as your GitHub username

**Required token scope**: `repo` (for reading issues and posting comments)

### Creating a Zap

#### Trigger: New Issue

1. Select "New Issue" as your trigger
2. Provide:
   - `owner` — GitHub username or organization
   - `repo` — Repository name
3. The trigger polls for new issues every few minutes

#### Action: Create Issue Comment

1. Select "Create Issue Comment" as your action
2. Provide:
   - `owner` — GitHub username or organization
   - `repo` — Repository name
   - `issue_number` — Issue number to comment on
   - `body` — Comment text (supports Markdown)

---

## Design Decisions

### Key Decisions & Tradeoffs

#### API Key vs OAuth

API Key authentication was chosen for its simplicity and a faster setup within the 3-hour timebox. OAuth would be the right choice for a production-grade integration.

#### Polling vs REST Hooks

Polling was selected to reduce implementation complexity. REST Hooks require managing webhook subscription and unsubscription logic, which adds significant overhead.

#### PR Filtering

GitHub's issues endpoint returns pull requests alongside issues. A filter was applied to exclude PRs, keeping the trigger output clean and predictable.

#### Pagination

A fixed `per_page: 25` was used for simplicity. A known limitation is that very active repositories could have more than 25 new issues between polls. Full pagination support is a recommended future improvement.

#### Error Handling

HTTP error cases (401, 404, 429) are handled via a shared `afterResponse` middleware. More granular retry logic and edge case coverage were deferred given the time constraint.

### Assumptions

- The 3-hour timebox required prioritizing working functionality over comprehensive edge case coverage.
- The GitHub REST API v3 endpoints used are stable and consistent.
- The integration is designed for typical repository activity; extremely high-volume repos may need pagination improvements.
- The Personal Access Token (PAT) has `repo` scope, which is sufficient for all operations in this integration.

---

## Challenge Requirements

- 1 working trigger + 1 working action
- Authentication + test call
- `zapier validate` passes with no errors
- `zapier push` completes successfully
- A Zap can be built and tested end-to-end in the Zapier editor

---

## AI Tools

#### Tools Used

Claude (planning, strategic guidance, and step-by-step technical decisions)
Claude Code (implementation and debugging assistance)

### AI Application

- **Planning**: Used to analyze the challenge requirements and select the most suitable trigger and action within the timebox.
- **Scaffolding**: Used to generate the authentication setup, and middleware boilerplate as a starting point.
- **Code generation**: Assisted in drafting the trigger and action implementations, which were then reviewed, tested, and adjusted manually.
- **Debugging**: Helped diagnose ESM/CommonJS compatibility issues and Zapier schema validation errors.
- **Documentation**: Assisted in drafting the README and inline code comments.
- **Decision making**: Consulted when evaluating implementation approaches such as API Key vs OAuth and polling vs REST hooks, as well as project structure and Zapier platform best practices.
- **Refactoring**: Used to suggest code organization improvements and ensure alignment with Zapier platform conventions.

### Example Prompts

**Trigger/Action Selection**:

```text
You are a software engineer with deep expertise in the Zapier Platform CLI and the GitHub REST API. Based on the challenge requirements shared in the attached PDF, recommend the best trigger options and best action options to implement for this integration.

For each option:
- Provide the exact GitHub REST API endpoint required and documentation as needed.
- Briefly explain why it is a good fit for this challenge

Constraints:
- The total implementation time is limited to 3 hours
- Authentication must use API Key (Personal Access Token)
```

**Authentication Setup**:

```text
I need to add authentication to my Zapier CLI integration for the GitHub REST API.

Requirements:
- Auth type: Custom (API Key)
- The Personal Access Token should be injected as `Authorization: Bearer ` on every request using a beforeRequest middleware
- Validate the credentials with a test call to `GET https://api.github.com/user`
```

**Documentation**:

```text
I need to create a README for my Zapier CLI integration with the GitHub REST API.

Requirements:
- High level description of the GitHub REST API and the specific use cases supported
  by this integration
- Key decisions and tradeoffs made during development, such as:
  - Using API Key
  - Using Polling
  - Any shortcuts taken due to the 3-hour timebox
- Assumptions that affected the solution, such as repo size and API stability
- Installation steps, available scripts, and project structure
```

**Trigger Development**:

```text
I need to implement a polling trigger for my Zapier CLI integration with the GitHub REST API.

Requirements:
- Trigger name: New Issue
- Poll for newly opened issues in a given repository
- Filter out pull requests from the results (GitHub returns them mixed with issues)
- Deduplicate results by `id`
- Input fields: `owner` (repository owner) and `repo` (repository name)

Endpoint:
- GET https://api.github.com/repos/{owner}/{repo}/issues
```

**Refactoring & Code Review**:

```text
I need a refactoring review of my Zapier CLI integration with the GitHub REST API.

Requirements:
- Review the overall project structure and suggest improvements
- Identify any code that doesn't follow Zapier Platform CLI best practices
- Suggest enhancements to improve code quality and readability
- Review error handling coverage and suggest any missing cases
- Review the middleware implementation and suggest improvements
- Check that all Zapier schema requirements are met correctly
- Identify any potential issues that could cause `zapier validate` to fail

Focus on:
- Zapier platform conventions and best practices
- Consistent error handling across triggers and actions
- Code organization and separation of concerns
```

---

## Resources

- [Zapier Platform CLI documentation](https://github.com/zapier/zapier-platform/blob/main/packages/cli/README.md)
- [GitHub REST API documentation](https://docs.github.com/en/rest)
- [GitHub Issues endpoint](https://docs.github.com/en/rest/issues/issues)
- [GitHub Issue Comments endpoint](https://docs.github.com/en/rest/issues/comments)
- [Personal Access Tokens guide](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
