# Release and Publishing Guide for metalsmith-safe-links

This document describes the setup and workflow for creating releases and publishing the metalsmith-safe-links plugin.

## Project Structure

The project is structured as follows:

- `/src/` - Source code
- `/lib/` - Built files (generated during build)
- `/test/` - Test files
- `.release-it.json` - Configuration for release-it
- `.npmignore` - Files to exclude from npm package
- `.gitignore` - Files to exclude from git

## Git and GitHub Releases

### Configuration

The release process is automated using [release-it](https://github.com/release-it/release-it), configured in `.release-it.json`:

```json
{
  "hooks": {
    "before:init": ["npm run lint", "npm test"],
    "after:bump": "auto-changelog -p --commit-limit false --ignore-commit-pattern '^((dev|chore|ci):|Release)'",
    "after:npm:bump": "npm pack && ls *.tgz",
    "after:release": "echo Successfully released ${name} v${version} to ${repo.repository}."
  },
  "git": {
    "commitMessage": "Release ${version}",
    "commitArgs": ["-S"],
    "tagAnnotation": "Release ${version}",
    "tagArgs": ["-s"],
    "changelog": "auto-changelog -u --commit-limit false --ignore-commit-pattern '^((dev|chore|ci):|Release)' --stdout -t https://raw.githubusercontent.com/release-it/release-it/master/templates/changelog-compact.hbs"
  },
  "npm": { "publish": false },
  "github": {
    "release": true,
    "releaseName": "metalsmith-safe-links ${version}",
    "tokenRef": "GITHUB_TOKEN",
    "assets": ["metalsmith-safe-links-${version}.tgz"]
  }
}
```

### Release Workflow

1. **Pre-release checks**:
   ```bash
   npm run release:check
   ```
   This runs linting, tests, and a dry-run of the release process.

2. **Create a release**:
   ```bash
   npm run release
   ```
   This will:
   - Run linting and tests
   - Bump the version in package.json
   - Generate a changelog
   - Create a git commit and tag
   - Create a GitHub release with the .tgz file as an asset

3. **Creating a release without incrementing the version**:
   If you need to create a release without incrementing the version (e.g., if a previous release failed):
   ```bash
   npm run build && GITHUB_TOKEN=$(grep GITHUB_TOKEN .env | cut -d '=' -f2) ./node_modules/.bin/release-it --no-increment --no-git
   ```

## NPM Publishing

### Configuration

The npm publishing is configured in `package.json`:

```json
{
  "files": [
    "lib/",
    "README.md",
    "LICENSE"
  ],
  "publishConfig": {
    "access": "public"
  }
}
```

Additionally, an `.npmignore` file is used to exclude development files from the npm package:

```
# Development files
/src/
/test/
/.github/
.eslintrc.json
.prettierrc
.release-it.json
# ... (other development files)
```

### Publishing Workflow

1. **Build the package**:
   ```bash
   npm run build
   ```
   This generates the files in the `/lib/` directory.

2. **Pack the package** (optional, for testing):
   ```bash
   npm pack
   ```
   This creates a `.tgz` file that you can inspect to ensure it contains the correct files.

3. **Publish to npm**:
   ```bash
   npm publish
   ```
   This publishes the package to npm.



## Key Files and Their Purpose

1. **`.gitignore`**:
   - Excludes build artifacts (`/lib/`) from git
   - Excludes `.tgz` files and other development artifacts

2. **`.npmignore`**:
   - Ensures `/lib/` is included in the npm package
   - Excludes source files and development files from the npm package

3. **`package.json`**:
   - `files` field explicitly lists files to include in the npm package
   - `prepublishOnly` script ensures the build is run before publishing

## Best Practices

1. **Always run tests before releasing**:
   ```bash
   npm test
   ```

2. **Check what will be published**:
   ```bash
   npm pack
   tar -tvf metalsmith-safe-links-*.tgz
   ```

3. **Use Node.js 20 or later**:
   The package is configured to work with Node.js 20 or later.

## Troubleshooting

### Missing `/lib/` directory in published package

If the `/lib/` directory is missing from the published package:

1. Check that `.npmignore` doesn't exclude the `/lib/` directory
2. Check that the `files` field in `package.json` includes the `/lib/` directory
3. Run `npm pack` and inspect the contents of the `.tgz` file

### Failed release

If a release fails but the changes were pushed to GitHub:

1. Use the `--no-increment` and `--no-git` flags with release-it to create a release without incrementing the version or creating a new tag:
   ```bash
   npm run build && GITHUB_TOKEN=$(grep GITHUB_TOKEN .env | cut -d '=' -f2) ./node_modules/.bin/release-it --no-increment --no-git
   ```
