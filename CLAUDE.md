# Claude Memory File

## Badges for Metalsmith Plugins

Common badges to add to README.md:

```markdown
[![metalsmith:plugin][metalsmith-badge]][metalsmith-url]
[![npm: version][npm-badge]][npm-url]
[![license: MIT][license-badge]][license-url]
[![coverage][coverage-badge]][coverage-url]
[![ESM/CommonJS][modules-badge]][npm-url]

[npm-badge]: https://img.shields.io/npm/v/metalsmith-static-files.svg
[npm-url]: https://www.npmjs.com/package/metalsmith-static-files
[metalsmith-badge]: https://img.shields.io/badge/metalsmith-plugin-green.svg?longCache=true
[metalsmith-url]: https://metalsmith.io
[license-badge]: https://img.shields.io/github/license/wernerglinka/metalsmith-static-files
[license-url]: LICENSE
[coverage-badge]: https://img.shields.io/badge/coverage-98%25-brightgreen
[coverage-url]: #test-coverage
[modules-badge]: https://img.shields.io/badge/modules-ESM%2FCJS-blue
```

These are the actual badges used for metalsmith-static-files. Just replace them with your plugin's name and GitHub repository for other plugins.

## Environment Setup

When starting a new session, run this to ensure the correct Node.js version is used:

```bash
source ~/.nvm/nvm.sh && nvm use
```

This will load NVM and automatically use the Node.js version specified in the project's .nvmrc file (20.12.1).

## Common Commands

Build the project:

```bash
npm run build
```

Run tests with coverage:

```bash
npm test
```

## Release Process

Check if the release will work correctly:

```bash
npm run release:check
```

Create an actual release:

```bash
npm run release
```

The release process:

1. Loads environment variables from .env file
2. Runs linting and tests
3. Updates the version in package.json
4. Generates a changelog with auto-changelog
5. Creates a git tag
6. Creates a GitHub release with the changelog
7. Creates an npm package (.tgz file) but does not publish it to npm

Required environment variables:

- `GITHUB_TOKEN` - A GitHub personal access token with repo scope

Notes on token handling:

1. The token is extracted directly from the .env file using grep and cut
2. It's set as an environment variable for the release-it command
3. No dotenv dependency is required for this approach
4. This ensures the token is reliably available to release-it

Reliable token extraction script for package.json:

```json
"release": "npm run build && GITHUB_TOKEN=$(grep GITHUB_TOKEN .env | cut -d '=' -f2) ./node_modules/.bin/release-it .",
"release:check": "npm run lint:check && npm run build && GITHUB_TOKEN=$(grep GITHUB_TOKEN .env | cut -d '=' -f2) ./node_modules/.bin/release-it . --dry-run"
```

This approach directly extracts the token from the .env file using grep and cut, making it more reliable than other methods.

You can also run the command with the token inline if needed:

```bash
GITHUB_TOKEN=your_token npm run release
```

## Metalsmith Plugin Best Practices

### Project Structure for Dual Module Packages

- `/src/` - Source code with dual export syntax
- `/lib/` - Built code (contains both ESM `.js` and CommonJS `.cjs` versions)
- `/test/` - Test files including specific tests for both module formats

### Dual Module Support Implementation (ESM and CommonJS)

- Configure package.json for dual module support:
  ```json
  "type": "module",
  "main": "./lib/index.cjs",
  "module": "./lib/index.js",
  "exports": {
    "import": "./lib/index.js",
    "require": "./lib/index.cjs"
  }
  ```
- Use microbundle to build both formats:
  ```json
  "build": "microbundle --entry src/index.js --output lib/index.js --target node -f esm,cjs --strict --generateTypes=false"
  ```
- Add both export types in source code:

  ```javascript
  // ESM export
  export default myPlugin;

  // CommonJS export compatibility
  if (typeof module !== 'undefined') {
    module.exports = myPlugin;
  }
  ```

- Create optimized tests for dual module support:
  - Main ESM test file (`test/index.js`) that imports directly from the src directory for full coverage:

    ```javascript
    // ESM test file for Metalsmith plugins
    import { strict as assert } from 'node:assert';
    import { fileURLToPath } from 'node:url';
    import { dirname, resolve } from 'node:path';
    import { readFileSync } from 'node:fs';
    import metalsmith from 'metalsmith';

    // Import the plugin directly from src for accurate coverage
    import plugin from '../src/index.js';

    // Get current directory and setup path utilities
    const __dirname = dirname(fileURLToPath(import.meta.url));

    describe('metalsmith-plugin-name (ESM)', () => {
      // Main functionality tests here

      // Verify ESM module loading
      it('should be importable as an ES module', () => {
        assert.strictEqual(typeof plugin, 'function', 'Plugin should be a function when imported with ESM');
        assert.strictEqual(typeof plugin(), 'function', 'Plugin should return a function when called');
      });
    });
    ```

  - Minimal CommonJS test file (`test/cjs.test.cjs`) to verify CJS compatibility:

    ```javascript
    // Minimal CommonJS test file - just verifies the CJS module works
    const assert = require('node:assert').strict;

    // Import the plugin using the CommonJS format
    const plugin = require('../lib/index.cjs');

    describe('metalsmith-plugin-name (CommonJS)', () => {
      // Verify the module loads correctly and exports a function
      it('should be properly importable as a CommonJS module', () => {
        assert.strictEqual(typeof plugin, 'function', 'Plugin should be a function when required with CommonJS');
        assert.strictEqual(typeof plugin(), 'function', 'Plugin should return a function when called');
      });

      // Add a basic functionality test to verify the plugin works
      it('should create expected metadata collections when used', () => {
        const instance = plugin();
        const files = {
          /* minimal test files */
        };
        const metadata = {};
        const metalsmithMock = {
          metadata: function () {
            return metadata;
          }
        };

        instance(files, metalsmithMock, () => {});

        // Verify basic functionality works
        assert.strictEqual(typeof metadata.someExpectedProperty, 'object', 'Plugin should add expected metadata');
      });
    });
    ```

  - Configure package.json to run both tests:
    ```json
    "scripts": {
      "test": "c8 --include=src/**/*.js mocha 'test/index.js' 'test/cjs.test.cjs' -t 15000",
      "test:esm": "c8 --include=src/**/*.js mocha test/index.js -t 15000",
      "test:cjs": "c8 --include=src/**/*.js mocha test/cjs.test.cjs -t 15000"
    }
    ```
- ESLint and Prettier configuration:
  - Keep ESLint config in `eslint.config.js` with ESM format
  - Keep Prettier config in `prettier.config.js` with ESM format
  - Include `.nvmrc` file to ensure consistent Node.js version
  - Ensure ESLint/Prettier ignore patterns include `lib/`, `coverage/` and `node_modules/`

### Code Quality

- Use Metalsmith's built-in debug capability instead of external debug module

  ```javascript
  // Define namespace at the top of the file
  const debugNs = 'metalsmith-plugin-name';

  // Then in your plugin function
  function plugin(options) {
    return function (files, metalsmith, done) {
      const debug = metalsmith.debug ? metalsmith.debug(debugNs) : () => {};
      debug('Running with options: %o', options);
      // rest of your code...
    };
  }
  ```

- Test the debug functionality (both with and without debug available):

  ```javascript
  it('should use metalsmith debug when available', function (done) {
    // Create a mock debug function that records calls
    const debugCalls = [];
    const mockMetalsmith = {
      path: (p) => p,
      destination: () => 'build',
      debug:
        () =>
        (...args) => {
          debugCalls.push(args);
          return true;
        }
    };

    // Create and call the plugin
    const pluginInstance = plugin({ source: 'src', destination: 'dest' });
    pluginInstance({}, mockMetalsmith, () => {
      // Verify debug was called with correct arguments
      assert(debugCalls.length > 0, 'Debug function should have been called');
      assert(debugCalls[0][0].includes('options'), 'Should include options message');
      assert(debugCalls[0][1].source === 'src', 'Should include source option');
      done();
    });
  });

  it('should handle missing debug method gracefully', function (done) {
    // Create a metalsmith mock without debug method
    const mockMetalsmith = {
      path: (p) => p,
      destination: () => 'build'
      // No debug property
    };

    // Should not throw error when debug is missing
    const pluginInstance = plugin({ source: 'src', destination: 'dest' });
    pluginInstance({}, mockMetalsmith, (err) => {
      assert.strictEqual(err, undefined, 'No error should occur when debug is missing');
      done();
    });
  });
  ```

- Use robust error handling
- Track loaded resources to prevent duplicates
- Add thorough documentation with JSDoc
- Add a Set to track loaded resources (like languages) to avoid duplicates
- Only run setup code conditionally when needed
- Use exact matching for conditionals instead of regex when possible

### Testing Strategy for Dual Module Packages

#### Test Organization

- `test/index.js` - Main ESM test file with complete functionality tests
- `test/cjs.test.cjs` - Minimal CommonJS compatibility tests
- `test/fixtures/` - Test fixtures for various scenarios

#### C8 Configuration for Accurate Coverage

Use a proper .c8rc.json configuration file:

```json
{
  "all": true,
  "include": ["src/**/*.js"],
  "exclude": ["node_modules/**", "test/**", "lib/**"],
  "reporter": ["text", "lcov"],
  "report-dir": "./coverage",
  "watermarks": {
    "lines": [80, 95],
    "functions": [80, 95],
    "branches": [80, 95],
    "statements": [80, 95]
  }
}
```

#### Key Coverage Reporting Strategies

1. **Import from src/ not lib/**:

   - ESM tests should import directly from `src/index.js` for accurate coverage
   - CJS tests must use `lib/index.cjs` since they can't import ESM directly

2. **Coverage Badge Script**:

   - Use a dedicated script to update the README with current coverage
   - Create a script like `scripts/update-coverage-badge.js` that:
     - Runs tests to generate coverage data
     - Extracts coverage information from the report
     - Updates README.md with badge and coverage table

   Example implementation:

   ```javascript
   #!/usr/bin/env node

   import fs from 'fs/promises';
   import { execSync } from 'child_process';
   import path from 'path';
   import { fileURLToPath } from 'url';

   // Get the current directory
   const __filename = fileURLToPath(import.meta.url);
   const __dirname = path.dirname(__filename);
   const rootDir = path.join(__dirname, '..');

   function determineBadgeColor(percentage) {
     if (percentage >= 90) {
       return 'brightgreen';
     }
     if (percentage >= 80) {
       return 'green';
     }
     if (percentage >= 70) {
       return 'yellowgreen';
     }
     if (percentage >= 60) {
       return 'yellow';
     }
     if (percentage >= 50) {
       return 'orange';
     }
     return 'red';
   }

   async function main() {
     try {
       process.stderr.write('Updating coverage badge in README.md...\n');

       // Run the full test suite to collect coverage
       process.stderr.write('Running full test suite for coverage data...\n');
       execSync('npm test', { stdio: 'inherit' });

       // Get the coverage data from the c8 report
       process.stderr.write('Extracting coverage data from report...\n');
       const coverageOutput = execSync('npx c8 report --reporter=text', { encoding: 'utf-8' });

       // Parse the coverage report
       const coverageData = parseCoverageReport(coverageOutput);

       if (coverageData) {
         process.stderr.write(`Successfully parsed coverage data\n`);
         await updateReadme(coverageData);
       } else {
         process.stderr.write('Could not parse coverage data, falling back to hardcoded values\n');
         await useHardcodedValues();
       }
     } catch (error) {
       console.error('Error updating coverage badge:', error);
       process.exit(1);
     }
   }

   // Implement parseCoverageReport, updateReadme, and useHardcodedValues functions
   // to extract data and update the README

   main();
   ```

3. **Package.json Scripts**:

```json
"scripts": {
    "build": "microbundle --entry src/index.js --output lib/index.js --target node -f esm,cjs --strict --generateTypes=false",
    "changelog": "auto-changelog -u --commit-limit false --ignore-commit-pattern '^((dev|chore|ci):|Release)'",
    "coverage": "npm test && c8 report --reporter=text-lcov > ./coverage.info",
    "format": "prettier --write \"**/*.{yml,md,js,json}\"",
    "format:check": "prettier --list-different \"**/*.{yml,md,js,json}\"",
    "lint": "eslint --fix .",
    "lint:check": "eslint --fix-dry-run .",
    "prepublishOnly": "npm run build",
    "update-coverage": "node scripts/update-coverage-badge.js",
    "prerelease": "npm run update-coverage && git add README.md && git commit -m \"Update coverage badge in README\" || true",
    "release": "npm run build && GITHUB_TOKEN=$(grep GITHUB_TOKEN .env | cut -d '=' -f2) ./node_modules/.bin/release-it . ",
    "release:check": "npm run lint:check && npm run build && GITHUB_TOKEN=$(grep GITHUB_TOKEN .env | cut -d '=' -f2) ./node_modules/.bin/release-it . --dry-run",
    "test": "c8 --include=src/**/*.js mocha 'test/index.js' 'test/cjs.test.cjs' -t 15000",
    "test:esm": "c8 --include=src/**/*.js mocha test/index.js -t 15000",
    "test:cjs": "c8 --include=src/**/*.js mocha test/cjs.test.cjs -t 15000",
    "test:e2e": "serve -l 3000 test/fixtures",
    "depcheck": "depcheck"
  },
```

#### Example Coverage Report in README

```
----------|---------|----------|---------|---------|-------------------
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------|---------|----------|---------|---------|-------------------
All files |   99.06 |    87.09 |     100 |   99.06 |
 index.js |   99.06 |    87.09 |     100 |   99.06 | 214-215
----------|---------|----------|---------|---------|-------------------
```

Include tests for:

1. **Basic functionality** - Core features
2. **Error handling** - Graceful handling of failures
3. **Edge cases** - Malformed input, missing data, etc.
4. **Multiple inputs** - Processing various inputs in one run
5. **Combined options** - Multiple options working together
6. **Performance** - Handling large inputs efficiently
7. **Context sensitivity** - Processing in correct contexts only
8. **Real-world examples** - Complex, realistic code

Test using direct plugin invocation for speed:

```javascript
const plugin = metalsmithPluginName(options);
plugin(files, metalsmith, done);
```

## Release Configuration Notes

- Keep `"npm": { "publish": false }` in .release-it.json - this project is manually published to npm
- The GitHub asset naming pattern should be: `metalsmith-<plugin-name>-${version}.tgz`

### Excluding Commits from Release Notes

The .release-it.json file includes patterns to exclude certain commits from appearing in release notes:

```json
"ignore-commit-pattern": "^((dev|chore|ci|docs|build|test):|Release|Update coverage|Fix.*badge|Remove dotenv)"
```

This pattern excludes:

- Commits that start with common prefixes like `chore:`, `docs:`, `test:`, etc.
- Commits related to coverage badge updates
- Dependency maintenance commits
- Release commits themselves

When making maintenance commits that shouldn't appear in release notes, use one of these prefixes or patterns.

For example:

- `chore: update dependencies`
- `docs: improve API documentation`
- `test: add more test cases`
- `build: fix build process`

Alternatively, you can update the ignore pattern in .release-it.json to exclude specific types of commits.

## Summary: Testing and Coverage for Dual Module Packages

### Key Insights

1. **Separate ESM and CJS Tests**:

   - Main ESM tests: Comprehensive functionality tests that import directly from `src/` for accurate coverage
   - Minimal CJS tests: Just enough to verify the CJS module works correctly

2. **Coverage Reporting Best Practices**:

   - Configure c8 with `.c8rc.json` to focus on source files (`src/`) and exclude built files (`lib/`)
   - Use a dedicated script to update the README with current coverage information
   - Import directly from `src/` in ESM tests to get accurate coverage metrics
   - Remember that CJS tests won't show coverage for ES modules - this is expected

3. **File Organization**:

   - `/test/index.js` - Main ESM tests with comprehensive coverage
   - `/test/cjs.test.cjs` - Minimal CJS compatibility tests
   - `/scripts/update-coverage-badge.js` - Coverage badge updater

4. **Common Issues and Solutions**:
   - If coverage reporting shows 0% when importing from `lib/`, switch to importing from `src/` in ESM tests
   - Use `.cjs` extension for CommonJS test files in an ESM project
   - If all else fails, use manually verified hardcoded values as a fallback in the coverage script

This approach ensures reliable code coverage reporting for dual-module packages while maintaining compatibility with both ESM and CommonJS.
