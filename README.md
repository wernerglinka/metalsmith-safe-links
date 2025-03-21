# metalsmith-safe-links

Metalsmith plugin to strip `<protocol://hostname>` from local links and to add _target_ and _rel_ attributes to external links.

[![metalsmith: plugin][metalsmith-badge]][metalsmith-url]
[![npm: version][npm-badge]][npm-url]
[![license: ISC][license-badge]][license-url]
[![coverage][coverage-badge]][coverage-url]
[![ESM/CommonJS][modules-badge]][npm-url]

As markdown syntax only allows for _alt_ and _title_ attributes, content editors normally must use HTML to add other link attributes. This plugin negates the use of HTML for links in a markdown document.

**This plugin must be used after markdown has been transformed into html**

## Installation

```
npm i metalsmith-safe-links --save
```

### Compatibility

This plugin works with:

- **Node.js**: Requires Node.js 18.0.0 or higher
- **Module formats**: Supports both ESM and CommonJS
- **Metalsmith**: Compatible with Metalsmith v2.0.0 and above

## Usage

This plugin supports both ESM and CommonJS environments.

### ESM (ECMAScript Modules)

```js
import metalsmith from 'metalsmith';
import layouts from '@metalsmith/layouts';
import metalsmithSafeLinks from 'metalsmith-safe-links';

metalsmith(__dirname)
  .use(layouts())
  .use(metalsmithSafeLinks({
    hostnames: ["www.livesite.com", "stagingsite.com"]
  }))
  .build();
```

### CommonJS

```js
const metalsmith = require('metalsmith');
const layouts = require('@metalsmith/layouts');
const metalsmithSafeLinks = require('metalsmith-safe-links');

metalsmith(__dirname)
  .use(layouts())
  .use(metalsmithSafeLinks({
    hostnames: ["www.livesite.com", "stagingsite.com"]
  }))
  .build();
```

## Options

### hostNames

An array of hostnames. The plugin will strip `<protocol://hostname>` from all links with these names.

```
Metalsmith(__dirname)
  .use(metalsmithSafeLinks({
    hostnames: ["www.livesite.com", "stagingsite.com"]
  }))
```

## Example

An **internal** markdown link

```
[Go to this page](https://www.livesite.com/this-page/)
```

will be transformed into

```
<a href="/this-page/">Go to this page</a>
```

An **external** markdown link

```
[Go to this site](https://www.externalsite.com/)
```

will be transformed into

```
<a href="https://www.externalsite.com/" target="_blank" rel="noopener noreferrer">Go to this site</a>
```

## Debug

This plugin uses Metalsmith's built-in debug support.

To enable debug logs, use Metalsmith's debug option or the DEBUG environment variable:

```javascript
// Enable debug in your metalsmith build
Metalsmith(__dirname)
  .debug(true) // This enables debug for all plugins
  .use(metalsmithSafeLinks({ hostnames: ['example.com'] }))
  .build();
```

Alternatively, enable debug only for specific namespaces:

```
DEBUG=metalsmith-safe-links
```

## CLI usage

To use this plugin with the Metalsmith CLI, add `metalsmith-safe-links` to the `plugins` key in your `metalsmith.json` file:

```json
{
  "plugins": [
    {
      "metalsmith-safe-links": {
        "hostnames": ["www.livesite.com", "stagingsite.com"]
      }
    }
  ]
}
```

## Technical Details

### Dual Module Support

This plugin is built as a dual module, supporting both ESM and CommonJS environments:

- **ESM**: Import with `import metalsmithSafeLinks from 'metalsmith-safe-links'`
- **CommonJS**: Require with `const metalsmithSafeLinks = require('metalsmith-safe-links')`

The package exports are configured in package.json:

```json
{
  "main": "./lib/index.cjs",
  "module": "./lib/index.js",
  "exports": {
    "import": "./lib/index.js",
    "require": "./lib/index.cjs"
  }
}
```

Both module formats are automatically generated during the build process using [microbundle](https://github.com/developit/microbundle).

## Authors

[werner@glinka.co](https://github.com/wernerglinka)

## License

Code released under [the ISC license](https://github.com/wernerglinka/metalsmith-safe-links/blob/main/LICENSE).

[npm-badge]: https://img.shields.io/npm/v/metalsmith-safe-links.svg
[npm-url]: https://www.npmjs.com/package/metalsmith-safe-links
[metalsmith-badge]: https://img.shields.io/badge/metalsmith-plugin-green.svg?longCache=true
[metalsmith-url]: https://metalsmith.io
[license-badge]: https://img.shields.io/github/license/wernerglinka/metalsmith-safe-links
[license-url]: LICENSE
[coverage-badge]: https://img.shields.io/badge/coverage-97%25-brightgreen
[coverage-url]: #test-coverage
[modules-badge]: https://img.shields.io/badge/modules-ESM%2FCJS-blue

## Test Coverage

This plugin maintains high statement and line coverage for the source code. Coverage is verified during the release process using the c8 coverage tool.

File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------|---------|----------|---------|---------|-------------------
All files | 97.16 | 87.5 | 66.66 | 97.16 |
 src | 97.16 | 87.5 | 66.66 | 97.16 | 120-121,140-141

