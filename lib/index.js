import * as cheerio from 'cheerio';
import { extname } from 'path';
import { parse } from 'url';

/**
 * HTML element selectors and their URL attributes to process
 * @type {Array<{selector: string, attr: string, isAnchor: boolean}>}
 */
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

/**
 * Process relative URLs that start with /
 * @param {Object} params - Processing parameters
 * @param {Object} params.element - Cheerio element
 * @param {string} params.attr - Attribute name (href, src, etc.)
 * @param {string} params.url - URL to process
 * @param {Object} params.opts - Plugin options
 * @param {Function} params.debug - Debug function
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
 * @param {Object} params.element - Cheerio element
 * @param {string} params.attr - Attribute name (href, src, etc.)
 * @param {string} params.url - URL to process
 * @param {boolean} params.isAnchor - Whether this is an anchor element
 * @param {Set} params.hostnames - Set of local hostnames
 * @param {Object} params.opts - Plugin options
 * @param {Function} params.debug - Debug function
 * @returns {Object} Processing result
 */
const processAbsoluteUrl = ({
  element,
  attr,
  url,
  isAnchor,
  hostnames,
  opts,
  debug
}) => {
  let localCount = 0;
  let externalCount = 0;
  try {
    const urlData = parse(url, true);

    // Only process links with protocol and hostname
    if (urlData.protocol && urlData.hostname) {
      // Check if hostname is in our "local" list
      if (hostnames.has(urlData.hostname)) {
        // Strip protocol and hostname from local link, prepend base path if provided
        localCount++;
        const pathWithQuery = (urlData.path || urlData.pathname || '') + (urlData.hash || '');
        const newUrl = opts.basePath ? `/${opts.basePath}${pathWithQuery}` : pathWithQuery;
        debug('Converting local %s: %s to %s', attr, url, newUrl);
        element.attr(attr, newUrl);
      } else if (isAnchor) {
        // Add target and rel to external anchor links only
        externalCount++;
        debug('Adding target and rel to external link: %s', url);
        element.attr('target', '_blank');
        element.attr('rel', 'noopener noreferrer');
      }
    }
  } catch (err) {
    debug('Error parsing URL %s: %s', url, err.message);
  }
  return {
    localCount,
    externalCount,
    processed: true
  };
};

/**
 * Check if URL should be skipped (special link types for anchors)
 * @param {string} url - URL to check
 * @param {boolean} isAnchor - Whether this is an anchor element
 * @returns {boolean} True if URL should be skipped
 */
const shouldSkipUrl = (url, isAnchor) => {
  return isAnchor && (url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:'));
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
  if (shouldSkipUrl(url, isAnchor)) {
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
 * Regular expression to match CSS url() functions
 * Matches: url(value), url('value'), url("value")
 * Captures the URL value without quotes
 */
const CSS_URL_REGEX = /url\(\s*(['"]?)([^'")]+)\1\s*\)/gi;

/**
 * Process URLs within CSS url() functions in style attributes
 * @param {string} styleValue - The style attribute value
 * @param {Set} hostnames - Set of local hostnames
 * @param {Object} opts - Plugin options
 * @param {Function} debug - Debug function
 * @returns {Object} Processing result with updated style and statistics
 */
const processStyleUrls = (styleValue, hostnames, opts, debug) => {
  if (!styleValue || typeof styleValue !== 'string') {
    return {
      updatedStyle: styleValue,
      localCount: 0,
      externalCount: 0,
      processed: false
    };
  }
  let localCount = 0;
  let externalCount = 0;
  let hasChanges = false;

  // Process all url() functions in the style
  const updatedStyle = styleValue.replace(CSS_URL_REGEX, (match, quote, url) => {
    if (!url || typeof url !== 'string') {
      return match;
    }
    debug('Processing CSS url(): %s', url);

    // Skip data URLs, hash fragments, and other special URLs
    if (url.startsWith('data:') || url.startsWith('#')) {
      debug('Skipping special CSS URL: %s', url);
      return match;
    }

    // Handle relative URLs that start with / (root-relative)
    if (url.startsWith('/') && !url.startsWith('//') && opts.basePath) {
      localCount++;
      hasChanges = true;
      const newUrl = `/${opts.basePath}${url}`;
      debug('Converting relative CSS url: %s to %s', url, newUrl);
      return `url(${quote}${newUrl}${quote})`;
    }

    // Handle absolute URLs with protocol and hostname
    try {
      const urlData = parse(url, true);

      // Only process URLs with protocol and hostname
      if (urlData.protocol && urlData.hostname) {
        // Check if hostname is in our "local" list
        if (hostnames.has(urlData.hostname)) {
          // Strip protocol and hostname from local URL, prepend base path if provided
          localCount++;
          hasChanges = true;
          const pathWithQuery = (urlData.path || urlData.pathname || '') + (urlData.hash || '');
          const newUrl = opts.basePath ? `/${opts.basePath}${pathWithQuery}` : pathWithQuery;
          debug('Converting local CSS url: %s to %s', url, newUrl);
          return `url(${quote}${newUrl}${quote})`;
        } else {
          // External URLs in CSS don't get target/rel attributes (not applicable to CSS)
          externalCount++;
          debug('Found external CSS url: %s', url);
        }
      }
    } catch (err) {
      debug('Error parsing CSS URL %s: %s', url, err.message);
    }
    return match;
  });
  return {
    updatedStyle,
    localCount,
    externalCount,
    processed: hasChanges
  };
};

/**
 * Process style attribute on an element
 * @param {Object} params - Processing parameters
 * @param {Object} params.element - Cheerio element
 * @param {Set} params.hostnames - Set of local hostnames
 * @param {Object} params.opts - Plugin options
 * @param {Function} params.debug - Debug function
 * @returns {Object} Processing statistics
 */
const processElementStyle = ({
  element,
  hostnames,
  opts,
  debug
}) => {
  const styleValue = element.attr('style');
  if (!styleValue) {
    return {
      localCount: 0,
      externalCount: 0,
      processed: false
    };
  }
  const result = processStyleUrls(styleValue, hostnames, opts, debug);
  if (result.processed) {
    element.attr('style', result.updatedStyle);
  }
  return {
    localCount: result.localCount,
    externalCount: result.externalCount,
    processed: result.processed
  };
};

/**
 * Check if a file is an HTML file
 * @param {string} filePath - Path to check
 * @returns {boolean} True if file is HTML
 */
const isHTMLFile = filePath => /\.html$|\.htm$/i.test(extname(filePath));

/**
 * Process a single HTML file
 * @param {string} file - File path
 * @param {Object} fileData - File data object
 * @param {Object} params - Processing parameters
 * @param {Set} params.hostnames - Set of local hostnames
 * @param {Object} params.opts - Plugin options
 * @param {Function} params.debug - Debug function
 * @returns {Object} Processing statistics
 */
const processHTMLFile = (file, fileData, {
  hostnames,
  opts,
  debug
}) => {
  const contents = fileData.contents.toString();

  // Load content into cheerio
  const $ = cheerio.load(contents, {
    decodeEntities: false
  });

  // Process all elements with URL attributes
  let linkCount = 0;
  let localLinkCount = 0;
  let externalLinkCount = 0;
  let styleCount = 0;
  let localStyleCount = 0;
  let externalStyleCount = 0;

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

  // Process inline styles on all elements with style attributes
  $('[style]').each(function () {
    const element = $(this);
    const {
      localCount,
      externalCount,
      processed
    } = processElementStyle({
      element,
      hostnames,
      opts,
      debug
    });
    if (processed) {
      styleCount++;
      localStyleCount += localCount;
      externalStyleCount += externalCount;
    }
  });

  // Save statistics
  debug(`File ${file}: processed ${linkCount} links (${localLinkCount} local, ${externalLinkCount} external), ${styleCount} inline styles (${localStyleCount} local, ${externalStyleCount} external)`);

  // Update file contents
  fileData.contents = Buffer.from($.html());
  return {
    linkCount,
    localLinkCount,
    externalLinkCount,
    styleCount,
    localStyleCount,
    externalStyleCount
  };
};

/**
 * Debug namespace
 * @type {string}
 */
const DEBUG_NAMESPACE = 'metalsmith-safe-links';

/**
 * Metalsmith plugin to process all site URLs across HTML elements and inline styles:
 * 1. Strips protocol and hostname from URLs to local sites (all elements and CSS url() functions)
 * 2. Prepends base path to relative URLs starting with / (all elements and CSS url() functions)
 * 3. Adds target="_blank" and rel="noopener noreferrer" to external anchor links
 * 4. Supports subdirectory deployments by processing both absolute and relative URLs
 * 
 * Processes URLs in: <a href>, <link href>, <script src>, <img src>, <iframe src>,
 * <source src>, <embed src>, <track src>, <form action>, <object data>, <video poster>, <area href>, <meta content>
 * Also processes CSS url() functions in style attributes: background-image: url(...), etc.
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
      processHTMLFile(file, files[file], {
        hostnames,
        opts,
        debug
      });
    });
    setImmediate(done);
  };
};

// CommonJS export compatibility (will be transformed by microbundle)
if (typeof module !== 'undefined') {
  module.exports = safeLinks;
}

export { safeLinks as default };
//# sourceMappingURL=index.js.map
