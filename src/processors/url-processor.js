import { parse as parseUrl } from 'url';

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
export const processRelativeUrl = ( { element, attr, url, opts, debug } ) => {
  const newUrl = `/${ opts.basePath }${ url }`;
  debug( 'Converting relative %s: %s to %s', attr, url, newUrl );
  element.attr( attr, newUrl );
  return { localCount: 1, externalCount: 0, processed: true };
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
export const processAbsoluteUrl = ( { element, attr, url, isAnchor, hostnames, opts, debug } ) => {
  let localCount = 0;
  let externalCount = 0;

  try {
    const urlData = parseUrl( url, true );

    // Only process links with protocol and hostname
    if ( urlData.protocol && urlData.hostname ) {
      // Check if hostname is in our "local" list
      if ( hostnames.has( urlData.hostname ) ) {
        // Strip protocol and hostname from local link, prepend base path if provided
        localCount++;
        const pathWithQuery = ( urlData.path || urlData.pathname || '' ) + ( urlData.hash || '' );
        const newUrl = opts.basePath ? `/${ opts.basePath }${ pathWithQuery }` : pathWithQuery;
        debug( 'Converting local %s: %s to %s', attr, url, newUrl );
        element.attr( attr, newUrl );
      } else if ( isAnchor ) {
        // Add target and rel to external anchor links only
        externalCount++;
        debug( 'Adding target and rel to external link: %s', url );
        element.attr( 'target', '_blank' );
        element.attr( 'rel', 'noopener noreferrer' );
      }
    }
  } catch ( err ) {
    debug( 'Error parsing URL %s: %s', url, err.message );
  }

  return { localCount, externalCount, processed: true };
};

/**
 * Check if URL should be skipped (special link types for anchors)
 * @param {string} url - URL to check
 * @param {boolean} isAnchor - Whether this is an anchor element
 * @returns {boolean} True if URL should be skipped
 */
export const shouldSkipUrl = ( url, isAnchor ) => {
  return isAnchor && ( url.startsWith( '#' ) || url.startsWith( 'mailto:' ) || url.startsWith( 'tel:' ) );
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
export const processUrlElement = ( { element, attr, url, isAnchor, hostnames, opts, debug } ) => {
  // Skip handling of special link types (only for anchors)
  if ( shouldSkipUrl( url, isAnchor ) ) {
    debug( 'Skipping special link: %s', url );
    return { localCount: 0, externalCount: 0 };
  }

  // Handle relative URLs that start with / (root-relative)
  if ( url.startsWith( '/' ) && !url.startsWith( '//' ) && opts.basePath ) {
    return processRelativeUrl( { element, attr, url, opts, debug } );
  }

  // Handle absolute URLs
  return processAbsoluteUrl( { element, attr, url, isAnchor, hostnames, opts, debug } );
};