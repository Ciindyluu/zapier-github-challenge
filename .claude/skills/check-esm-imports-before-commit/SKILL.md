---
description: Validate ES Module imports after staging changes, before committing. Ensures .js extensions and proper ESM syntax compliance.
---

## ESM Import Validation Checks

This project uses ES Modules (`"type": "module"` in package.json) and requires strict import conventions.

### 1. Find All JavaScript Files
`find . -type f -name "*.js" ! -path "./node_modules/*" ! -path "./.git/*"`

**Purpose**: Identify all JS files to validate

### 2. Check for Missing .js Extensions
`grep -rn "from ['\"]\..*[^.js]['\"]" --include="*.js" --exclude-dir=node_modules --exclude-dir=.git . || echo "No missing extensions found"`

**Validates**: All relative imports include `.js` extension

### 3. Check for CommonJS Syntax
`grep -rn "require(" --include="*.js" --exclude-dir=node_modules --exclude-dir=.git . || echo "No require() found"`

**Validates**: No `require()` usage (should use `import` instead)

### 4. Check for CommonJS Exports
`grep -rn "module\.exports\|exports\." --include="*.js" --exclude-dir=node_modules --exclude-dir=.git . || echo "No module.exports found"`

**Validates**: No `module.exports` or `exports.` (should use `export` instead)

### 5. Check for __dirname or __filename
`grep -rn "__dirname\|__filename" --include="*.js" --exclude-dir=node_modules --exclude-dir=.git . || echo "No __dirname/__filename found"`

**Validates**: No CommonJS globals (use `import.meta.url` if needed)

### 6. Validate JSON Imports
`grep -rn "from ['\"].*\.json['\"]" --include="*.js" --exclude-dir=node_modules --exclude-dir=.git . || echo "No JSON imports found"`

**Purpose**: Check if JSON imports use proper syntax: `import data from './file.json' with { type: 'json' }`

## Instructions

1. **Run all validation commands** above in sequence

2. **Analyze results** for each check:
   - **Missing .js extensions**: Imports like `from './utils/validators'` should be `from './utils/validators.js'`
   - **require() usage**: CommonJS syntax not supported in ESM projects
   - **module.exports**: Should use `export default` or `export const`
   - **__dirname/__filename**: ESM doesn't support these; use `import.meta.url` or Node.js path utilities
   - **JSON imports**: Must use import assertion syntax for Node.js ESM

3. **Categorize violations** by severity:
   - **Critical**: Missing `.js` extensions (will cause runtime errors)
   - **Critical**: `require()` or `module.exports` usage (syntax errors in ESM)
   - **High**: `__dirname`/`__filename` usage (runtime errors)
   - **Medium**: Improper JSON imports (may fail depending on Node version)

4. **Summarize findings** in bullet points:
   - Total number of violations found
   - Breakdown by violation type with file paths and line numbers
   - List each affected file with format: `[filename.js:line](filename.js#Lline)`
   - Prioritize fixes by severity (critical first)

5. **Provide fix recommendations**:
   - For missing `.js` extensions: Show exact import line and corrected version
   - For CommonJS syntax: Show ESM equivalent conversion
   - For JSON imports: Show proper import assertion syntax
   - Suggest running ESLint (`npm run lint`) which should catch import extension issues

## Common ESM Patterns

### ✅ Correct ESM Syntax

```javascript
// Local file imports (MUST include .js)
import { helper } from './utils/helper.js';
import config from './config.js';

// JSON imports (requires assertion)
import packageJson from './package.json' with { type: 'json' };

// Named exports
export const myFunction = () => {};
export { myFunction, anotherFunction };

// Default exports
export default MyClass;

// Directory path (if needed)
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

### ❌ Incorrect ESM Syntax

```javascript
// Missing .js extension
import { helper } from './utils/helper'; // ❌

// CommonJS require
const config = require('./config'); // ❌

// CommonJS exports
module.exports = MyClass; // ❌
exports.myFunction = () => {}; // ❌

// CommonJS globals
console.log(__dirname); // ❌ (not available in ESM)

// JSON without assertion (may fail)
import packageJson from './package.json'; // ❌
```

## Post-Validation Actions

**If violations found:**
- Provide file-by-file fix list with line numbers
- Show before/after code snippets for each violation
- Suggest batch find-replace patterns for common issues
- Recommend running `npm run lint:fix` after manual fixes
- Offer to fix violations if user approves

**If no violations found:**
- Confirm: "✓ All ESM import/export syntax is valid"
- Note: "Project follows ES Module conventions correctly"

## Integration with Other Skills

- Run this skill **before** `/validate-before-git-push` to catch ESM issues early
- Violations here will likely cause lint or test failures
- Consider adding this to a pre-commit hook for automatic checking
