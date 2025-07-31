# metalsmith-safe-links - Project Notes

This plugin processes HTML files to automatically handle internal and external links:
- Strips protocol/hostname from internal links (making them relative)
- Adds `target="_blank"` and `rel="noopener noreferrer"` to external links

**Current Status**: 100% MCP Server Quality Score ✅

## Quick Commands

**Quality & Validation:**
```bash
npx metalsmith-plugin-mcp-server validate . --functional  # Validate with MCP server
npm test                                                   # Run tests with coverage
npm run lint                                              # Lint and fix code
```

**Release Process:**
```bash
npm run release:patch   # Bug fixes (1.5.4 → 1.5.5)
npm run release:minor   # New features (1.5.4 → 1.6.0)  
npm run release:major   # Breaking changes (1.5.4 → 2.0.0)
```

**Development:**
```bash
npm run build          # Build ESM/CJS versions
npm run test:coverage  # Run tests with detailed coverage
```

## Plugin Functionality

**Input**: HTML files with links
**Output**: HTML files with processed links

**Example transformations:**
- `https://www.mysite.com/page/` → `/page/` (internal links made relative)
- `https://external.com/` → `https://external.com/` + `target="_blank" rel="noopener noreferrer"`

**Configuration:**
```javascript
metalsmithSafeLinks({
  hostnames: ['www.mysite.com', 'staging.mysite.com']  // Your internal domains
})
```

## Recent Updates (v1.5.4)

✅ **Enhanced to meet MCP Server quality standards:**
- Added secure release scripts using GitHub CLI (`npm run release:patch/minor/major`)
- Added `test:coverage` script for detailed coverage reporting  
- Updated all dependencies to latest versions
- Fixed token handling in `.release-it.json` (now uses `GH_TOKEN`)
- Added `.editorconfig` for consistent formatting
- Achieved 100% MCP Server quality score

🔧 **Technical improvements:**
- Dual module support (ESM/CommonJS) working correctly
- Test coverage at 97.16% with comprehensive test suite
- Secure release process using `./scripts/release.sh`
- All quality checks passing (lint, tests, coverage)

💡 **For future development:**
- Use MCP server for validation: `npx metalsmith-plugin-mcp-server validate . --functional`
- Use MCP server for dependency updates: `npx metalsmith-plugin-mcp-server update-deps .`
- Configuration templates available via: `npx metalsmith-plugin-mcp-server show-template <type>`
