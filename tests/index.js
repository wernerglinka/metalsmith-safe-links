/* global describe, it */

'use strict';

import * as chai from 'chai';
import metalsmith from 'metalsmith';
import metalsmithLinks from '../lib/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

/* eslint-disable no-underscore-dangle */
const __dirname = dirname( fileURLToPath( import.meta.url ) );

const { expect } = chai;

const fixture = path.resolve.bind( path, __dirname, 'fixtures/markup' );

function file( _path ) {
  return fs.readFileSync( fixture( _path ), 'utf8' );
}

describe( 'metalsmith-prism', () => {

  it( 'should strip host name from local links href', done => {

    const metal = metalsmith( fixture() );

    metal
      .use( metalsmithLinks( {
        hostnames: [ "www.potatohead.com" ]
      } ) )
      .build( err => {

        if ( err ) {
          return done( err );
        }

        expect( file( 'build/local-link.html' ) ).to.be.eql( file( 'expected/local-link.html' ) );


        done();
      } );

  } );

  it( 'should add target and rel attributes to external links', done => {

    const metal = metalsmith( fixture() );

    metal
      .use( metalsmithLinks( {
        hostnames: [ "www.potatohead.com" ]
      } ) )
      .build( err => {

        if ( err ) {
          return done( err );
        }

        expect( file( 'build/external-link.html' ) ).to.be.eql( file( 'expected/external-link.html' ) );


        done();
      } );

  } );

} );
