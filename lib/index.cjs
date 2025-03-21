'use strict';

var cheerio = require('cheerio');
var debugModule = require('debug');
var path = require('path');
var url = require('url');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n["default"] = e;
  return n;
}

var cheerio__namespace = /*#__PURE__*/_interopNamespace(cheerio);
var debugModule__default = /*#__PURE__*/_interopDefaultLegacy(debugModule);
var url__default = /*#__PURE__*/_interopDefaultLegacy(url);

const debug = debugModule__default["default"]('metalsmith-safe-links');
const isHTMLFile = filePath => {
  return /\.html|\.htm/.test(path.extname(filePath));
};

/**
 * Metalsmith plugin to process all site links.
 * 
 * Adds a target and rel attribute to all external links and 
 * strips the protocol and domain parts of any local link
 * 
 *
 * @param  {Object} options
 *   @property {array} hostnames
 */

const safeLinks = options => {
  options = options || {
    hostnames: []
  };
  if (!options.hostnames.length) {
    console.log("Missing Host Name(s)");
    return;
  }
  const hostnames = options.hostnames;
  return (files, metalsmith, done) => {
    // Use metalsmith's built-in debug if available
    const debugFn = metalsmith.debug ? metalsmith.debug('metalsmith-safe-links') : debug;
    debugFn('Processing links with options: %o', options);
    setImmediate(done);
    Object.keys(files).forEach(file => {
      if (!isHTMLFile(file)) {
        return;
      }
      const contents = files[file].contents.toString();
      const $ = cheerio__namespace.load(contents, {
        decodeEntities: false
      }, true);
      $('a').each(function () {
        const thisLink = $(this);
        const linkAttributes = thisLink[0].attribs;
        const urlString = typeof linkAttributes.href === "string" ? url__default["default"].parse(linkAttributes.href, true) : null;

        // check all links that have a protocol string, this implies that they also have a hostname
        if (urlString && urlString.protocol) {
          // check if this url is local
          if (hostnames.includes(urlString.hostname)) {
            // strip protocol//hostname from local link 
            debugFn('Converting local link: %s to %s', linkAttributes.href, urlString.pathname);
            thisLink.attr("href", urlString.pathname);
          } else {
            // add target='_blank' and rel='noopener noreferrer' to all external links
            debugFn('Adding target and rel to external link: %s', linkAttributes.href);
            thisLink.attr("target", "_blank");
            thisLink.attr("rel", "noopener noreferrer");
          }
        }
      });
      files[file].contents = Buffer.from($.html());
    });
  };
};

// CommonJS export compatibility
if (typeof module !== 'undefined') {
  module.exports = safeLinks;
}

module.exports = safeLinks;
//# sourceMappingURL=index.cjs.map
