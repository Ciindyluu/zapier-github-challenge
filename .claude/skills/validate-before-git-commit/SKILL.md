---
description: Verify that the application has no errors after staging changes, before committing and pushing changes to the remote repository.
---

## Pre-Push Validation Checks

Run all validation checks in sequence to ensure the application is ready for deployment:

### 1. Code Formatting
`npm run format:check`

**Validates**: Prettier formatting rules (single quotes, semicolons, 2-space indentation, 100-char line width)

### 2. Linting
`npm run lint`

**Validates**: ESLint rules (Airbnb base config, import extensions, code style)

### 3. Test Suite
`npm run test`

**Validates**: All unit tests pass (Vitest)

### 4. Zapier Schema
`zapier validate`

**Validates**: Integration schema is valid (triggers, actions, authentication structure)

### 5. Test Coverage
`npx vitest run --coverage`

**Validates**: Test coverage meets standards (identifies untested files/functions)

## Git Status Check

`git status`

**Purpose**: Review staged/unstaged changes before validation summary

## Instructions

1. **Execute all validation commands** in the order above
2. **Track results** for each check (✓ pass / ✗ fail)
3. **Analyze failures** if any checks fail:
   - **Format failures**: Run `npm run format` to auto-fix, then re-check
   - **Lint failures**: Review errors; run `npm run lint:fix` for auto-fixable issues
   - **Test failures**: Identify failing test file and error message; investigate root cause
   - **Schema failures**: Review Zapier validation output for structural issues
   - **Coverage failures**: Identify files with <80% coverage; prioritize business logic in `src/triggers/`, `src/creates/`, `src/utils/`

4. **Summarize findings** in 3-5 bullet points:
   - Overall status: "All checks passed ✓" or "X/5 checks failed"
   - List specific failures with file paths and brief error description
   - Note the current branch and number of files changed (from git status)
   - Highlight any critical issues that block deployment
   - Confirm readiness: "Ready to push" or "Requires fixes before push"

5. **Provide actionable next steps**:
   - If all pass: "✓ All validation checks passed. Safe to run `git push`"
   - If failures exist: List specific commands to fix each issue
   - Suggest running `/check-test-coverage` if test failures indicate missing coverage

## Post-Validation Actions

**If all checks pass:**
- Confirm: "Application is validated and ready to push to remote repository"
- Suggest: Review git status output to confirm expected files are staged
- Remind: Consider running `zapier logs --type=http --detailed` after push to monitor

**If checks fail:**
- Block push until all issues resolved
- Provide fix commands for each failure category
- Offer to re-run validation after fixes applied