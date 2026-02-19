'use strict';

import { isHTMLFile, processHTMLFile } from './processors/file-processor.js';

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
const safeLinks = ( options = {} ) => {
  // Set default options
  const opts = {
    hostnames: [],
    basePath: '',
    ...options
  };

  // Validate required options
  if ( !opts.hostnames.length ) {
    console.warn( `${ DEBUG_NAMESPACE }: Missing hostnames array. Plugin will not process any files.` );
    return ( files, metalsmith, done ) => {
      setImmediate( done );
    };
  }

  // Store hostnames for faster lookups
  const hostnames = new Set( opts.hostnames );

  /**
   * Process files
   * @param {Object} files - Metalsmith files object
   * @param {Object} metalsmith - Metalsmith instance
   * @param {Function} done - Callback function
   */
  return ( files, metalsmith, done ) => {
    // Use metalsmith's built-in debug if available
    const debug = metalsmith.debug( DEBUG_NAMESPACE );
    debug( 'Processing links with options: %o', opts );

    // Get HTML files only
    const htmlFiles = Object.keys( files ).filter( isHTMLFile );

    if ( htmlFiles.length === 0 ) {
      debug( 'No HTML files found to process' );
      return setImmediate( done );
    }

    debug( `Processing ${ htmlFiles.length } HTML files` );

    try {
      // Process each HTML file
      htmlFiles.forEach( ( file ) => {
        processHTMLFile( file, files[ file ], { hostnames, opts, debug } );
      } );

      debug( 'Completed processing all HTML files' );
      done();
    } catch ( error ) {
      debug( 'Error processing files: %s', error.message );
      done( error );
    }
  };
};

// Set function name for better debugging
Object.defineProperty( safeLinks, 'name', {
  value: 'metalsmith-safe-links'
} );

// ESM export
export default safeLinks;