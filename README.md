# metalsmith-safe-links

Metalsmith plugin to strip `<protocol://hostname>` from local links and to add _target_ and _rel_ attributes to external links.

[![metalsmith: plugin][metalsmith-badge]][metalsmith-url]
[![npm: version][npm-badge]][npm-url]
[![license: ISC][license-badge]][license-url]

As markdown syntax only allows for _alt_ and _title_ attributes, content editors normally must use HTML to add other link attributes. This plugin negates the use of HTML for links in a markdown document.

**This plugin must be used after markdown has been transformed into html**

## Installation

```
npm i metalsmith-safe-links --save
```

## Usage

```
const metalsmith = require('metalsmith');
const layouts = require('@metalsmith/layouts')
const metalsmithLinks = require('metalsmith-links');

metalsmith(__dirname)
  .use(layouts())
  .use(metalsmithLinks({
    hostnames: ["www.livesite.com", "stagingsite.com"]
  }))
  .build();
```

## Options

### hostNames

An array of hostnames. The plugin will strip `<protocol://hostname>` from all links with these names. 

```
Metalsmith(__dirname)
  .use(metalsmithLinks({
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

To enable debug logs, set the `DEBUG` environment variable to `metalsmith-safe-links`:

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



## Authors
+ [werner@glinka.co](https://github.com/wernerglinka)


## License

Code released under [the ISC license](https://github.com/wernerglinka/metalsmith-safe-links/blob/main/LICENSE).

[npm-badge]: https://img.shields.io/npm/v/metalsmith-safe-links.svg
[npm-url]: https://www.npmjs.com/package/metalsmith-safe-links
[metalsmith-badge]: https://img.shields.io/badge/metalsmith-plugin-green.svg?longCache=true
[metalsmith-url]: https://metalsmith.io
[license-badge]: https://img.shields.io/github/license/wernerglinka/metalsmith-safe-links
[license-url]: LICENSE