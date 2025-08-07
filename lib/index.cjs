'use strict';

var cheerio = require('cheerio');
var path = require('path');
var url = require('url');

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

/**
 * Debug namespace
 * @type {string}
 */
const DEBUG_NAMESPACE = 'metalsmith-safe-links';

/**
 * Check if a file is an HTML file
 * @param {string} filePath - Path to check
 * @returns {boolean} True if file is HTML
 */
const isHTMLFile = filePath => /\.html$|\.htm$/i.test(path.extname(filePath));

/**
 * Process relative URLs that start with /
 * @param {Object} params - Processing parameters
 * @returns {Object} Processing result
 */
const processRelativeUrl = ({
  element,
  attr,
  url,
  opts,
  debug
}) => {
  const newUrl = `/${opts.basePath}${url}`;
  debug('Converting relative %s: %s to %s', attr, url, newUrl);
  element.attr(attr, newUrl);
  return {
    localCount: 1,
    externalCount: 0,
    processed: true
  };
};

/**
 * Process absolute URLs with protocol and hostname
 * @param {Object} params - Processing parameters
 * @returns {Object} Processing result
 */
const processAbsoluteUrl = ({
  element,
  attr,
  url: url$1,
  isAnchor,
  hostnames,
  opts,
  debug
}) => {
  let localCount = 0;
  let externalCount = 0;
  try {
    const urlData = url.parse(url$1, true);

    // Only process links with protocol and hostname
    if (urlData.protocol && urlData.hostname) {
      // Check if hostname is in our "local" list
      if (hostnames.has(urlData.hostname)) {
        // Strip protocol and hostname from local link, prepend base path if provided
        localCount++;
        const pathWithQuery = (urlData.path || urlData.pathname || '') + (urlData.hash || '');
        const newUrl = opts.basePath ? `/${opts.basePath}${pathWithQuery}` : pathWithQuery;
        debug('Converting local %s: %s to %s', attr, url$1, newUrl);
        element.attr(attr, newUrl);
      } else if (isAnchor) {
        // Add target and rel to external anchor links only
        externalCount++;
        debug('Adding target and rel to external link: %s', url$1);
        element.attr('target', '_blank');
        element.attr('rel', 'noopener noreferrer');
      }
    }
  } catch (err) {
    debug('Error parsing URL %s: %s', url$1, err.message);
  }
  return {
    localCount,
    externalCount,
    processed: true
  };
};

/**
 * Process a single URL element
 * @param {Object} params - Processing parameters
 * @param {Object} params.element - Cheerio element
 * @param {string} params.attr - Attribute name (href, src, etc.)
 * @param {string} params.url - URL to process
 * @param {boolean} params.isAnchor - Whether this is an anchor element
 * @param {Set} params.hostnames - Set of local hostnames
 * @param {Object} params.opts - Plugin options
 * @param {Function} params.debug - Debug function
 * @returns {Object} Processing stats
 */
const processUrlElement = ({
  element,
  attr,
  url,
  isAnchor,
  hostnames,
  opts,
  debug
}) => {
  // Skip handling of special link types (only for anchors)
  if (isAnchor && (url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:'))) {
    debug('Skipping special link: %s', url);
    return {
      localCount: 0,
      externalCount: 0
    };
  }

  // Handle relative URLs that start with / (root-relative)
  if (url.startsWith('/') && !url.startsWith('//') && opts.basePath) {
    return processRelativeUrl({
      element,
      attr,
      url,
      opts,
      debug
    });
  }

  // Handle absolute URLs
  return processAbsoluteUrl({
    element,
    attr,
    url,
    isAnchor,
    hostnames,
    opts,
    debug
  });
};

/**
 * Metalsmith plugin to process all site URLs across HTML elements:
 * 1. Strips protocol and hostname from URLs to local sites (all elements)
 * 2. Prepends base path to relative URLs starting with / (all elements)
 * 3. Adds target="_blank" and rel="noopener noreferrer" to external anchor links
 * 4. Supports subdirectory deployments by processing both absolute and relative URLs
 * 
 * Processes URLs in: <a href>, <link href>, <script src>, <img src>, <iframe src>,
 * <source src>, <embed src>, <track src>, <form action>, <object data>, <video poster>, <area href>, <meta content>
 *
 * @param {Object} options - Plugin options
 * @param {string[]} options.hostnames - Array of hostnames considered "local"
 * @param {string} options.basePath - Base path for the site (e.g., "base-path" for sites deployed in subdirectories)
 * @returns {Function} Metalsmith plugin function
 */
const safeLinks = (options = {}) => {
  // Set default options
  const opts = {
    hostnames: [],
    basePath: '',
    ...options
  };

  // Validate required options
  if (!opts.hostnames.length) {
    console.warn(`${DEBUG_NAMESPACE}: Missing hostnames array. Plugin will not process any files.`);
    return (files, metalsmith, done) => {
      setImmediate(done);
    };
  }

  // Store hostnames for faster lookups
  const hostnames = new Set(opts.hostnames);

  /**
   * Process files
   * @param {Object} files - Metalsmith files object
   * @param {Object} metalsmith - Metalsmith instance
   * @param {Function} done - Callback function
   */
  return (files, metalsmith, done) => {
    // Use metalsmith's built-in debug if available
    const debug = metalsmith.debug(DEBUG_NAMESPACE);
    debug('Processing links with options: %o', opts);

    // Get HTML files only
    const htmlFiles = Object.keys(files).filter(isHTMLFile);
    if (htmlFiles.length === 0) {
      debug('No HTML files found to process');
      return setImmediate(done);
    }
    debug(`Processing ${htmlFiles.length} HTML files`);

    // Process each HTML file
    htmlFiles.forEach(file => {
      const contents = files[file].contents.toString();

      // Load content into cheerio
      const $ = cheerio__namespace.load(contents, {
        decodeEntities: false
      });

      // Process all elements with URL attributes
      let linkCount = 0;
      let localLinkCount = 0;
      let externalLinkCount = 0;

      // Define elements and their URL attributes to process
      const urlSelectors = [{
        selector: 'a[href]',
        attr: 'href',
        isAnchor: true
      }, {
        selector: 'link[href]',
        attr: 'href',
        isAnchor: false
      }, {
        selector: 'area[href]',
        attr: 'href',
        isAnchor: false
      }, {
        selector: 'script[src]',
        attr: 'src',
        isAnchor: false
      }, {
        selector: 'img[src]',
        attr: 'src',
        isAnchor: false
      }, {
        selector: 'iframe[src]',
        attr: 'src',
        isAnchor: false
      }, {
        selector: 'source[src]',
        attr: 'src',
        isAnchor: false
      }, {
        selector: 'embed[src]',
        attr: 'src',
        isAnchor: false
      }, {
        selector: 'track[src]',
        attr: 'src',
        isAnchor: false
      }, {
        selector: 'form[action]',
        attr: 'action',
        isAnchor: false
      }, {
        selector: 'object[data]',
        attr: 'data',
        isAnchor: false
      }, {
        selector: 'video[poster]',
        attr: 'poster',
        isAnchor: false
      }, {
        selector: 'meta[content]',
        attr: 'content',
        isAnchor: false
      }];

      // Process each selector type
      urlSelectors.forEach(({
        selector,
        attr,
        isAnchor
      }) => {
        $(selector).each(function () {
          const element = $(this);
          const elementAttributes = element[0].attribs;
          const url = elementAttributes[attr];
          if (!url || typeof url !== 'string') {
            return;
          }
          linkCount++;

          // Process the URL element
          const {
            localCount,
            externalCount
          } = processUrlElement({
            element,
            attr,
            url,
            isAnchor,
            hostnames,
            opts,
            debug
          });
          localLinkCount += localCount;
          externalLinkCount += externalCount;
        });
      });

      // Save statistics
      debug(`File ${file}: processed ${linkCount} links (${localLinkCount} local, ${externalLinkCount} external)`);

      // Update file contents
      files[file].contents = Buffer.from($.html());
    });
    setImmediate(done);
  };
};

// CommonJS export compatibility (will be transformed by microbundle)
if (typeof module !== 'undefined') {
  module.exports = safeLinks;
}

module.exports = safeLinks;
//# sourceMappingURL=index.cjs.map
