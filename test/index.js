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
      const hasProcessedLink =
        content.includes('<a href="/path?query=test#fragment">Link with query and fragment</a>') ||
        content.includes('<a href="/path">Link with query and fragment</a>');
      assert(hasProcessedLink, 'Should process local links with query and fragment');

      // Just check that the invalid URL link still exists in some form
      assert(content.includes('Invalid URL'), 'Should preserve invalid URL content');

      done();
    });
  });

  // Test base path functionality
  it('should prepend base path to local links when basePath is provided', (done) => {
    // Create plugin instance with base path
    const plugin = metalsmithLinks({ 
      hostnames: ['example.com'],
      basePath: 'my-app'
    });

    // Create test files
    const files = {
      'basepath-test.html': {
        contents: Buffer.from(`<html><body>
<a href="https://example.com/page/">Local link</a>
<a href="https://external.com/page/">External link</a>
</body></html>`)
      }
    };

    // Mock Metalsmith object
    const metalsmithMock = { debug: () => () => {} };

    // Call the plugin directly
    plugin(files, metalsmithMock, () => {
      // Verify the content was processed correctly
      const content = files['basepath-test.html'].contents.toString();
      
      // Local link should have base path prepended
      assert(content.includes('<a href="/my-app/page/">Local link</a>'), 
        'Local link should have base path prepended');
      
      // External link should have target and rel attributes
      assert(content.includes('target="_blank"') && content.includes('rel="noopener noreferrer"'), 
        'External link should have target and rel attributes');
        
      done();
    });
  });

  it('should work normally when basePath is empty string', (done) => {
    // Create plugin instance with empty base path
    const plugin = metalsmithLinks({ 
      hostnames: ['example.com'],
      basePath: ''
    });

    // Create test files
    const files = {
      'no-basepath-test.html': {
        contents: Buffer.from(`<html><body>
<a href="https://example.com/page/">Local link</a>
</body></html>`)
      }
    };

    // Mock Metalsmith object
    const metalsmithMock = { debug: () => () => {} };

    // Call the plugin directly
    plugin(files, metalsmithMock, () => {
      // Verify the content was processed correctly
      const content = files['no-basepath-test.html'].contents.toString();
      
      // Local link should not have base path prepended
      assert(content.includes('<a href="/page/">Local link</a>'), 
        'Local link should not have base path when basePath is empty');
        
      done();
    });
  });

  it('should handle complex paths with base path correctly', (done) => {
    // Create plugin instance with base path
    const plugin = metalsmithLinks({ 
      hostnames: ['mysite.com'],
      basePath: 'sub/directory'
    });

    // Create test files with various path scenarios
    const files = {
      'complex-paths.html': {
        contents: Buffer.from(`<html><body>
<a href="https://mysite.com/">Root link</a>
<a href="https://mysite.com/page">Page without trailing slash</a>
<a href="https://mysite.com/deep/path/page.html">Deep path</a>
<a href="https://mysite.com/path?query=test#fragment">Link with query and fragment</a>
</body></html>`)
      }
    };

    // Mock Metalsmith object
    const metalsmithMock = { debug: () => () => {} };

    // Call the plugin directly
    plugin(files, metalsmithMock, () => {
      const content = files['complex-paths.html'].contents.toString();
      
      // Verify various path transformations
      assert(content.includes('<a href="/sub/directory/">Root link</a>'), 
        'Root link should have base path');
      assert(content.includes('<a href="/sub/directory/page">Page without trailing slash</a>'), 
        'Page link should have base path');
      assert(content.includes('<a href="/sub/directory/deep/path/page.html">Deep path</a>'), 
        'Deep path should have base path');
      assert(content.includes('<a href="/sub/directory/path?query=test#fragment">Link with query and fragment</a>'), 
        'Link with query and fragment should have base path');
        
      done();
    });
  });

  // Test processing of all HTML element types
  it('should process URLs in all supported HTML elements', (done) => {
    // Create plugin instance with base path
    const plugin = metalsmithLinks({ 
      hostnames: ['example.com'],
      basePath: 'app'
    });

    // Create test files with various element types
    const files = {
      'all-elements-test.html': {
        contents: Buffer.from(`<html><head>
<link href="https://example.com/styles.css" rel="stylesheet">
<script src="https://example.com/script.js"></script>
</head><body>
<a href="https://example.com/page/">Link</a>
<img src="https://example.com/image.jpg" alt="Image">
<iframe src="https://example.com/iframe.html"></iframe>
<form action="https://example.com/submit">Form</form>
<video poster="https://example.com/poster.jpg">
  <source src="https://example.com/video.mp4" type="video/mp4">
  <track src="https://example.com/captions.vtt" kind="captions">
</video>
<object data="https://example.com/object.pdf"></object>
<embed src="https://example.com/embed.swf">
<area href="https://example.com/area/" shape="rect">
<a href="https://external.com/page/">External Link</a>
<img src="https://external.com/external.jpg" alt="External Image">
</body></html>`)
      }
    };

    // Mock Metalsmith object
    const metalsmithMock = { debug: () => () => {} };

    // Call the plugin directly
    plugin(files, metalsmithMock, () => {
      const content = files['all-elements-test.html'].contents.toString();
      
      // Verify local URLs have base path prepended
      assert(content.includes('href="/app/styles.css"'), 'Link element should have base path');
      assert(content.includes('src="/app/script.js"'), 'Script element should have base path');
      assert(content.includes('href="/app/page/"'), 'Anchor element should have base path');
      assert(content.includes('src="/app/image.jpg"'), 'Image element should have base path');
      assert(content.includes('src="/app/iframe.html"'), 'Iframe element should have base path');
      assert(content.includes('action="/app/submit"'), 'Form element should have base path');
      assert(content.includes('poster="/app/poster.jpg"'), 'Video poster should have base path');
      assert(content.includes('src="/app/video.mp4"'), 'Source element should have base path');
      assert(content.includes('src="/app/captions.vtt"'), 'Track element should have base path');
      assert(content.includes('data="/app/object.pdf"'), 'Object element should have base path');
      assert(content.includes('src="/app/embed.swf"'), 'Embed element should have base path');
      assert(content.includes('href="/app/area/"'), 'Area element should have base path');
      
      // Verify external anchor gets target/rel but external image doesn't
      assert(content.includes('href="https://external.com/page/" target="_blank" rel="noopener noreferrer"'), 
        'External anchor should have target and rel');
      assert(content.includes('src="https://external.com/external.jpg"') && !content.includes('external.jpg" target='), 
        'External image should not have target attribute');
        
      done();
    });
  });

  it('should handle relative URLs without modification', (done) => {
    // Create plugin instance
    const plugin = metalsmithLinks({ 
      hostnames: ['example.com'],
      basePath: 'app'
    });

    // Create test files with relative URLs
    const files = {
      'relative-urls-test.html': {
        contents: Buffer.from(`<html><body>
<a href="/relative-link">Relative Link</a>
<img src="./local-image.jpg" alt="Local Image">
<link href="../styles.css" rel="stylesheet">
<script src="js/script.js"></script>
</body></html>`)
      }
    };

    // Mock Metalsmith object
    const metalsmithMock = { debug: () => () => {} };

    // Call the plugin directly
    plugin(files, metalsmithMock, () => {
      const content = files['relative-urls-test.html'].contents.toString();
      
      // Verify relative URLs are unchanged (no protocol/hostname to process)
      assert(content.includes('href="/relative-link"'), 'Relative link should be unchanged');
      assert(content.includes('src="./local-image.jpg"'), 'Relative image should be unchanged');
      assert(content.includes('href="../styles.css"'), 'Relative stylesheet should be unchanged');
      assert(content.includes('src="js/script.js"'), 'Relative script should be unchanged');
        
      done();
    });
  });

  // Test debug function usage
  it('should use provided debug function', () => {
    // Create a debug function tracker
    let debugCalled = false;
    const debugFn = () => {
      debugCalled = true;
    };

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
