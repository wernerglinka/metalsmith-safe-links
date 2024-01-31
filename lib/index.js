'use strict';

import cheerio from 'cheerio';
import debugModule from 'debug';
const debug = debugModule( 'metalsmith-safe-links' );
import { extname } from 'path';
import url from 'url';

const isHTMLFile = ( filePath ) => {
  return /\.html|\.htm/.test( extname( filePath ) );
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

export default ( options ) => {

  options = options || {
    hostnames: [],
  };

  if ( !options.hostnames.length ) {
    console.log( "Missing Host Name(s)" );
    return;
  }

  const hostnames = options.hostnames;

  return ( files, metalsmith, done ) => {
    setImmediate( done );

    Object.keys( files ).forEach( file => {

      if ( !isHTMLFile( file ) ) {
        return;
      }

      const contents = files[ file ].contents.toString();
      const $ = cheerio.load( contents, { decodeEntities: false }, true );

      $( 'a' ).each( function () {
        const thisLink = $( this );
        const linkAttributes = thisLink[ 0 ].attribs;
        const urlString = typeof linkAttributes.href === "string" ? url.parse( linkAttributes.href, true ) : null;

        // check all links that have a protocol string, this implies that they also have a hostname
        if ( urlString && urlString.protocol ) {
          // check if this url is local
          if ( hostnames.includes( urlString.hostname ) ) {
            // strip protocol//hostname from local link 
            thisLink.attr( "href", urlString.pathname );
          } else {
            // add target='_blank' and rel='noopener noreferrer' to all external links
            thisLink.attr( "target", "_blank" );
            thisLink.attr( "rel", "noopener noreferrer" );
          }
        }
      } );

      files[ file ].contents = Buffer.from( $.html() );
    } );
  };
};