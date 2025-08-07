# metalsmith-safe-links - Project Notes

## MCP Server Integration (CRITICAL)

**IMPORTANT**: This plugin was created with `metalsmith-plugin-mcp-server`. When working on this plugin, AI assistants (Claude) MUST use the MCP server tools rather than creating their own implementations.

### Essential MCP Commands

```bash
# List all available templates
list-templates

# Get specific template content (use these exactly as provided)
get-template plugin/CLAUDE.md
get-template configs/release-it.json
get-template configs/eslint.config.js

# Validate plugin and get actionable recommendations
validate .

# Generate configuration files
configs .

# Show recommended configuration templates
show-template release-it
show-template eslint

# Update dependencies
update-deps .
```

### CRITICAL RULES for AI Assistants

1. **ALWAYS use MCP server templates verbatim** - Never create simplified versions
2. **ALWAYS use `list-templates` first** to see what's available
3. **ALWAYS use `get-template`** to retrieve exact template content
4. **NEVER improvise or create custom implementations** when MCP server provides templates
5. **When validation recommends templates**, use the exact commands provided
6. **If a command seems unclear**, ask the user for clarification rather than improvising

### Common Mistakes to AVOID

**❌ Wrong Approach:**
- Creating custom CLAUDE.md content instead of using `get-template plugin/CLAUDE.md`
- Scaffolding entire new plugins when you just need a template
- Making up template content or "simplifying" official templates
- Ignoring validation recommendations
- Using commands like `npx metalsmith-plugin-mcp-server scaffold ./ CLAUDE.md claude-context`

**✅ Correct Approach:**
- Use `list-templates` to see what's available
- Use `get-template <template-name>` to get exact content
- Follow validation recommendations exactly as provided
- Ask for clarification when commands seem confusing
- Always use official templates verbatim

### Quick Commands

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



This plugin processes HTML files to automatically handle URLs across all HTML elements:
- Strips protocol/hostname from internal URLs (making them relative) for ALL elements
- Adds `target="_blank"` and `rel="noopener noreferrer"` to external anchor links only
- Supports base path prepending for subdirectory deployments

**Processes URLs in:** `<a href>`, `<link href>`, `<script src>`, `<img src>`, `<iframe src>`, `<source src>`, `<track src>`, `<embed src>`, `<form action>`, `<object data>`, `<video poster>`, `<area href>`

**Perfect for sites deployed in subdirectories** - handles all asset references in one place.

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
