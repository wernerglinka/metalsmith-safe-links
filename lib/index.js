import * as cheerio from 'cheerio';
import { extname } from 'path';
import { parse } from 'url';

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
const isHTMLFile = filePath => /\.html$|\.htm$/i.test(extname(filePath));

/**
 * Metalsmith plugin to process all site links:
 * 1. Strips protocol and hostname from links to local sites
 * 2. Adds target="_blank" and rel="noopener noreferrer" to external links
 *
 * @param {Object} options - Plugin options
 * @param {string[]} options.hostnames - Array of hostnames considered "local"
 * @returns {Function} Metalsmith plugin function
 */
const safeLinks = (options = {}) => {
  // Set default options
  const opts = {
    hostnames: [],
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
    const debug = metalsmith.debug ? metalsmith.debug(DEBUG_NAMESPACE) : () => {};
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
      const $ = cheerio.load(contents, {
        decodeEntities: false
      });

      // Process all links
      let linkCount = 0;
      let localLinkCount = 0;
      let externalLinkCount = 0;
      $('a').each(function () {
        const thisLink = $(this);
        const linkAttributes = thisLink[0].attribs;
        const href = linkAttributes.href;
        if (!href || typeof href !== 'string') {
          return;
        }
        linkCount++;

        // Skip handling of special link types
        if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
          debug('Skipping special link: %s', href);
          return;
        }

        // Parse URL
        try {
          const urlData = parse(href, true);

          // Only process links with protocol and hostname
          if (urlData.protocol && urlData.hostname) {
            // Check if hostname is in our "local" list
            if (hostnames.has(urlData.hostname)) {
              // Strip protocol and hostname from local link
              localLinkCount++;
              debug('Converting local link: %s to %s', href, urlData.pathname);
              thisLink.attr('href', urlData.pathname);
            } else {
              // Add target and rel to external link
              externalLinkCount++;
              debug('Adding target and rel to external link: %s', href);
              thisLink.attr('target', '_blank');
              thisLink.attr('rel', 'noopener noreferrer');
            }
          }
        } catch (err) {
          debug('Error parsing URL %s: %s', href, err.message);
        }
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

export { safeLinks as default };
//# sourceMappingURL=index.js.map
