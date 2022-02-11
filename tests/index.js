/* global describe, it */

'use strict';

const chai = require('chai');
const metalsmith = require('metalsmith');
const metalsmithLinks = require('../lib');
const fs = require('fs');
const path = require('path');
const expect = chai.expect;

const fixture = path.resolve.bind(path, __dirname, 'fixtures/markup');

function file(_path) {
  return fs.readFileSync(fixture(_path), 'utf8');
}

describe('metalsmith-prism', () => {

  it('should strip host name from local links href', done => {

    const metal = metalsmith(fixture());

    metal
      .use(metalsmithLinks({
          hostNames: ["www.potatohead.com"]
        }))
      .build( err => {

        if (err) {
          return done(err);
        }

        expect(file('build/local-link.html')).to.be.eql(file('expected/local-link.html'));
        

        done();
      });

  });

  it('should add target and rel attributes to external links', done => {

    const metal = metalsmith(fixture());

    metal
      .use(metalsmithLinks({
          hostNames: ["www.potatohead.com"]
        }))
      .build( err => {

        if (err) {
          return done(err);
        }

        expect(file('build/external-link.html')).to.be.eql(file('expected/external-link.html'));
        

        done();
      });

  });

});
