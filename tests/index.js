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
    assert.strictEqual(typeof metalsmithLinks({hostnames: ["example.com"]}), 'function', 'Plugin should return a function when called');
  });

  it('should strip host name from local links href', done => {
    const metal = metalsmith(fixture());

    metal
      .use(metalsmithLinks({
        hostnames: ["www.potatohead.com"]
      }))
      .build(err => {
        if (err) {
          return done(err);
        }

        assert.strictEqual(
          file('build/local-link.html'),
          file('expected/local-link.html')
        );

        done();
      });
  });

  it('should add target and rel attributes to external links', done => {
    const metal = metalsmith(fixture());

    metal
      .use(metalsmithLinks({
        hostnames: ["www.potatohead.com"]
      }))
      .build(err => {
        if (err) {
          return done(err);
        }

        assert.strictEqual(
          file('build/external-link.html'),
          file('expected/external-link.html')
        );

        done();
      });
  });

});
