import * as cheerio from 'cheerio';
import { extname } from 'path';
import { urlSelectors } from '../config/selectors.js';
import { processUrlElement } from './url-processor.js';

/**
 * Check if a file is an HTML file
 * @param {string} filePath - Path to check
 * @returns {boolean} True if file is HTML
 */
export const isHTMLFile = ( filePath ) => /\.html$|\.htm$/i.test( extname( filePath ) );

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
export const processHTMLFile = ( file, fileData, { hostnames, opts, debug } ) => {
  const contents = fileData.contents.toString();

  // Load content into cheerio
  const $ = cheerio.load( contents, {
    decodeEntities: false
  } );

  // Process all elements with URL attributes
  let linkCount = 0;
  let localLinkCount = 0;
  let externalLinkCount = 0;

  // Process each selector type
  urlSelectors.forEach( ( { selector, attr, isAnchor } ) => {
    $( selector ).each( function() {
      const element = $( this );
      const elementAttributes = element[ 0 ].attribs;
      const url = elementAttributes[ attr ];

      if ( !url || typeof url !== 'string' ) {
        return;
      }

      linkCount++;

      // Process the URL element
      const { localCount, externalCount } = processUrlElement( { element, attr, url, isAnchor, hostnames, opts, debug } );
      localLinkCount += localCount;
      externalLinkCount += externalCount;
    } );
  } );

  // Save statistics
  debug( `File ${ file }: processed ${ linkCount } links (${ localLinkCount } local, ${ externalLinkCount } external)` );

  // Update file contents
  fileData.contents = Buffer.from( $.html() );

  return { linkCount, localLinkCount, externalLinkCount };
};