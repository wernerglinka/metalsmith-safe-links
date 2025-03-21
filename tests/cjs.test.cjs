'use strict';

// Minimal CommonJS test file - just verifies the CJS module works
const assert = require('node:assert').strict;
const path = require('path');

describe('metalsmith-safe-links (CommonJS)', () => {
  it('should be properly importable as a CommonJS module', function() {
    // This test will be skipped until the build is run
    if (!require('fs').existsSync(path.resolve(__dirname, '../lib/index.cjs'))) {
      console.log('SKIPPING: Run npm run build first to generate the CommonJS version');
      this.skip();
      return;
    }
    
    // Import the plugin using the CommonJS format
    const plugin = require('../lib/index.cjs');
    
    // Verify the module loads correctly and exports a function
    assert.strictEqual(typeof plugin, 'function', 'Plugin should be a function when required with CommonJS');
    assert.strictEqual(typeof plugin({hostnames: ["example.com"]}), 'function', 'Plugin should return a function when called');
  });
  
  it('should handle basic functionality when used', function() {
    // Skip if CJS version doesn't exist yet
    if (!require('fs').existsSync(path.resolve(__dirname, '../lib/index.cjs'))) {
      this.skip();
      return;
    }
    
    const plugin = require('../lib/index.cjs');
    const instance = plugin({hostnames: ["example.com"]});
    
    // Create minimal test setup
    const files = {
      'test.html': {
        contents: Buffer.from('<a href="https://example.com/test">Test</a>')
      }
    };
    
    // Mock Metalsmith object
    const metalsmith = {
      debug: () => () => {}
    };
    
    // Call the plugin synchronously
    instance(files, metalsmith, () => {});
    
    // Just verify the file was processed
    assert(files['test.html'].contents.toString().includes('<a href="/test">Test</a>'), 
      'Plugin should strip hostname from local links');
  });
});