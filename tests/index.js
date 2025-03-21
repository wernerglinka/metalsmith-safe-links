'use strict';

import { strict as assert } from 'node:assert';
import metalsmith from 'metalsmith';
import metalsmithLinks from '../src/index.js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const fixture = resolve.bind(null, __dirname, 'fixtures/markup');

function file(_path) {
  return readFileSync(fixture(_path), 'utf8');
}

describe('metalsmith-safe-links (ESM)', () => {
  // Test ESM module loading
  it('should be importable as an ES module', () => {
    assert.strictEqual(typeof metalsmithLinks, 'function', 'Plugin should be a function when imported with ESM');
    assert.strictEqual(
      typeof metalsmithLinks({ hostnames: ['example.com'] }),
      'function',
      'Plugin should return a function when called'
    );
  });
  
  // Test with missing hostnames option
  it('should handle missing hostnames option gracefully', (done) => {
    // Create plugin instance with empty options
    const plugin = metalsmithLinks({});
    
    // Should return a function that calls done immediately
    assert.strictEqual(typeof plugin, 'function', 'Should return a function with empty options');
    
    // Call the plugin directly with mock data
    const files = { 'test.html': { contents: Buffer.from('<a href="test">Test</a>') } };
    const metalsmithMock = { debug: () => () => {} };
    
    // Since we're using setImmediate internally, we need to handle it asynchronously
    plugin(files, metalsmithMock, () => {
      done();
    });
  });
  
  // Test with empty files (no HTML files)
  it('should handle no HTML files gracefully', (done) => {
    // Create plugin instance
    const plugin = metalsmithLinks({ hostnames: ['example.com'] });
    
    // Empty files object
    const files = {};
    const metalsmithMock = { debug: () => () => {} };
    
    // Since we're using setImmediate internally, we need to handle it asynchronously
    plugin(files, metalsmithMock, () => {
      // If we got here, the test passed
      done();
    });
  });

  it('should strip host name from local links href', (done) => {
    const metal = metalsmith(fixture());

    metal
      .use(
        metalsmithLinks({
          hostnames: ['www.potatohead.com']
        })
      )
      .build((err) => {
        if (err) {
          return done(err);
        }

        assert.strictEqual(file('build/local-link.html'), file('expected/local-link.html'));

        done();
      });
  });

  it('should add target and rel attributes to external links', (done) => {
    const metal = metalsmith(fixture());

    metal
      .use(
        metalsmithLinks({
          hostnames: ['www.potatohead.com']
        })
      )
      .build((err) => {
        if (err) {
          return done(err);
        }

        assert.strictEqual(file('build/external-link.html'), file('expected/external-link.html'));

        done();
      });
  });
  
  // Test handling of various edge cases with links
  it('should handle various link edge cases gracefully', (done) => {
    // Create plugin instance
    const plugin = metalsmithLinks({ hostnames: ['example.com'] });
    
    // Create test files with various link types
    const files = {
      'edge-cases.html': {
        contents: Buffer.from(`<html><body>
<a>No href attribute</a>
<a href="">Empty href</a>
<a href="#anchor">Anchor link</a>
<a href="mailto:test@example.com">Email link</a>
<a href="tel:+1234567890">Phone link</a>
<a href="https://example.com/path?query=test#fragment">Link with query and fragment</a>
<a href="invalid://url">Invalid URL</a>
</body></html>`)
      }
    };
    
    // Mock Metalsmith object
    const metalsmithMock = { debug: () => () => {} };
    
    // Call the plugin directly
    plugin(files, metalsmithMock, () => {
      // Verify the content was processed correctly
      const content = files['edge-cases.html'].contents.toString();
      
      // No href should remain unchanged
      assert(content.includes('<a>No href attribute</a>'), 'Should preserve links with no href');
      
      // Empty href should remain unchanged
      assert(content.includes('<a href="">Empty href</a>'), 'Should preserve links with empty href');
      
      // Special link types should remain unchanged
      assert(content.includes('<a href="#anchor">Anchor link</a>'), 'Should preserve anchor links');
      assert(content.includes('<a href="mailto:test@example.com">Email link</a>'), 'Should preserve mailto links');
      assert(content.includes('<a href="tel:+1234567890">Phone link</a>'), 'Should preserve tel links');
      
      // Verify that example.com URL is processed in some way
      const hasProcessedLink = content.includes('<a href="/path?query=test#fragment">Link with query and fragment</a>') || 
                              content.includes('<a href="/path">Link with query and fragment</a>');
      assert(hasProcessedLink, 'Should process local links with query and fragment');
      
      // Just check that the invalid URL link still exists in some form
      assert(content.includes('Invalid URL'), 'Should preserve invalid URL content');
      
      done();
    });
  });
  
  // Test debug function usage
  it('should use provided debug function', () => {
    // Create a debug function tracker
    let debugCalled = false;
    const debugFn = () => { debugCalled = true; };
    
    // Mock Metalsmith object with debug function
    const metalsmithMock = {
      debug: () => debugFn
    };
    
    // Create plugin instance
    const plugin = metalsmithLinks({ hostnames: ['example.com'] });
    
    // Create test files
    const files = {
      'debug-test.html': {
        contents: Buffer.from('<a href="https://example.com/test">Test</a>')
      }
    };
    
    // Call the plugin directly
    plugin(files, metalsmithMock, () => {});
    
    // Verify debug function was called
    assert.strictEqual(debugCalled, true, 'Debug function should have been called');
  });
});
