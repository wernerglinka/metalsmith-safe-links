import { parse as parseUrl } from 'url';

/**
 * Regular expression to match CSS url() functions
 * Matches: url(value), url('value'), url("value")
 * Captures the full content including spaces and quotes
 */
const CSS_URL_REGEX = /url\((\s*)(['"]?)([^'")]+)\2(\s*)\)/gi;

/**
 * Check if a CSS URL should be skipped (special URLs)
 * @param {string} url - The URL to check
 * @returns {boolean} True if URL should be skipped
 */
const shouldSkipCssUrl = ( url ) => {
  return url.startsWith( 'data:' ) || url.startsWith( '#' );
};

/**
 * Process a root-relative CSS URL
 * @param {Object} params - Processing parameters
 * @returns {Object} Processing result
 */
const processRootRelativeCssUrl = ( { url, leadingSpace, quote, trailingSpace, opts, debug } ) => {
  const newUrl = `/${ opts.basePath }${ url }`;
  debug( 'Converting relative CSS url: %s to %s', url, newUrl );
  return {
    replacement: `url(${ leadingSpace }${ quote }${ newUrl }${ quote }${ trailingSpace })`,
    localCount: 1,
    externalCount: 0,
    processed: true
  };
};

/**
 * Process an absolute CSS URL
 * @param {Object} params - Processing parameters
 * @returns {Object} Processing result
 */
const processAbsoluteCssUrl = ( { url, leadingSpace, quote, trailingSpace, hostnames, opts, debug } ) => {
  try {
    const urlData = parseUrl( url, true );

    // Only process URLs with protocol and hostname
    if ( urlData.protocol && urlData.hostname ) {
      // Check if hostname is in our "local" list
      if ( hostnames.has( urlData.hostname ) ) {
        const pathWithQuery = ( urlData.path || urlData.pathname || '' ) + ( urlData.hash || '' );
        const newUrl = opts.basePath ? `/${ opts.basePath }${ pathWithQuery }` : pathWithQuery;
        debug( 'Converting local CSS url: %s to %s', url, newUrl );
        return {
          replacement: `url(${ leadingSpace }${ quote }${ newUrl }${ quote }${ trailingSpace })`,
          localCount: 1,
          externalCount: 0,
          processed: true
        };
      } 
        // External URLs in CSS don't get target/rel attributes (not applicable to CSS)
        debug( 'Found external CSS url: %s', url );
        return {
          replacement: null,
          localCount: 0,
          externalCount: 1,
          processed: false
        };
      
    }
  } catch ( err ) {
    debug( 'Error parsing CSS URL %s: %s', url, err.message );
  }

  return {
    replacement: null,
    localCount: 0,
    externalCount: 0,
    processed: false
  };
};

/**
 * Process URLs within CSS url() functions in style attributes
 * @param {string} styleValue - The style attribute value
 * @param {Set} hostnames - Set of local hostnames
 * @param {Object} opts - Plugin options
 * @param {Function} debug - Debug function
 * @returns {Object} Processing result with updated style and statistics
 */
export const processStyleUrls = ( styleValue, hostnames, opts, debug ) => {
  if ( !styleValue || typeof styleValue !== 'string' ) {
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
  const updatedStyle = styleValue.replace( CSS_URL_REGEX, ( match, ...urlParts ) => {
    const [ leadingSpace, quote, url, trailingSpace ] = urlParts;
    
    if ( !url || typeof url !== 'string' ) {
      return match;
    }

    debug( 'Processing CSS url(): %s', url );

    // Skip data URLs, hash fragments, and other special URLs
    if ( shouldSkipCssUrl( url ) ) {
      debug( 'Skipping special CSS URL: %s', url );
      return match;
    }

    // Handle relative URLs that start with / (root-relative)
    if ( url.startsWith( '/' ) && !url.startsWith( '//' ) && opts.basePath ) {
      const result = processRootRelativeCssUrl( { url, leadingSpace, quote, trailingSpace, opts, debug } );
      localCount += result.localCount;
      hasChanges = result.processed || hasChanges;
      return result.replacement;
    }

    // Handle absolute URLs with protocol and hostname
    const result = processAbsoluteCssUrl( { url, leadingSpace, quote, trailingSpace, hostnames, opts, debug } );
    localCount += result.localCount;
    externalCount += result.externalCount;
    hasChanges = result.processed || hasChanges;
    
    return result.replacement || match;
  } );

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
export const processElementStyle = ( { element, hostnames, opts, debug } ) => {
  const styleValue = element.attr( 'style' );
  
  if ( !styleValue ) {
    return { localCount: 0, externalCount: 0, processed: false };
  }

  const result = processStyleUrls( styleValue, hostnames, opts, debug );
  
  if ( result.processed ) {
    element.attr( 'style', result.updatedStyle );
  }

  return {
    localCount: result.localCount,
    externalCount: result.externalCount,
    processed: result.processed
  };
};