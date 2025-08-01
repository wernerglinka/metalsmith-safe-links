# metalsmith-safe-links

Metalsmith plugin to strip `<protocol://hostname>` from local links and to add _target_ and _rel_ attributes to external links.

As markdown syntax only allows for _alt_ and _title_ attributes, content editors normally must use HTML to add other link attributes. This plugin negates the use of HTML for links in a markdown document.

[![metalsmith: plugin][metalsmith-badge]][metalsmith-url]
[![npm: version][npm-badge]][npm-url]
[![license: ISC][license-badge]][license-url]
[![coverage][coverage-badge]][coverage-url]
[![ESM/CommonJS][modules-badge]][npm-url]
[![Known Vulnerabilities](https://snyk.io/test/npm/metalsmith-safe-links/badge.svg)](https://snyk.io/test/npm/metalsmith-safe-links)

## Installation

```
npm i metalsmith-safe-links
```

## Usage

**This plugin must be used after markdown has been transformed into html**

This plugin supports both ESM and CommonJS environments.

### ESM (ECMAScript Modules)

```js
import metalsmith from 'metalsmith';
import markdown from '@metalsmith/markdown';
import layouts from '@metalsmith/layouts';
import metalsmithSafeLinks from 'metalsmith-safe-links';

metalsmith(__dirname)
  .use(markdown())
  .use(layouts())
  .use(
    metalsmithSafeLinks({
      hostnames: ['www.livesite.com', 'stagingsite.com']
    })
  )
  .build();
```

### CommonJS

```js
const metalsmith = require('metalsmith');
const markdown = require('@metalsmith/markdown');
const layouts = require('@metalsmith/layouts');
const metalsmithSafeLinks = require('metalsmith-safe-links');

metalsmith(__dirname)
  .use(markdown())
  .use(layouts())
  .use(
    metalsmithSafeLinks({
      hostnames: ['www.livesite.com', 'stagingsite.com']
    })
  )
  .build();
```

## Options

- **hostNames** [array] - an array of hostnames. The plugin will strip `<protocol://hostname>` from all links with these names.

## Examples

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

To enable debug logs, set the DEBUG environment variable to metalsmith-safe-links:

```javascript
metalsmith.env('DEBUG', '@metalsmith/metadata*');
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
[coverage-badge]: https://img.shields.io/badge/test%20coverage-97%25-brightgreen
[coverage-url]: https://github.com/wernerglinka/metalsmith-safe-links/actions/workflows/test.yml
[modules-badge]: https://img.shields.io/badge/modules-ESM%2FCJS-blue
