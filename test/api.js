'use strict';
let debug = require('debug')('raml-store-test');
let request = require('supertest');
let chai = require('chai');
let expect = chai.expect;
let fs = require('fs');
let path = require('path');

let express = require('express');
let app = express();
let ramlRouter = require('../raml-store')('RAML');
app.use('/api-spec/', ramlRouter);

describe('testing override api-designer', function () {

  it('should serve an html page including the persistence module when requesting /api-spec/', function (done) {
    request(app)
    .get('/api-spec/')
    .expect(200, /angular\-persistence\.js/, done);
  });

  it('should serve overridden files correctly', function (done) {
    request(app)
    .get('/api-spec/angular-persistence.js')
    .expect(200, /angular\.module\('ramlEditorApp'\)/, done);
  });

  it('should serve api-designer file correctly', function (done) {
    request(app)
    .get('/api-spec/styles/api-designer.css')
    .expect(200, /html\[role=api-designer\] div\.container/, done);
  });

});

describe.only('angular-persistence functionality covered', function () {

  it('should allow directory(), retrieve RAML/ directory', function (done) {
    request(app)
    .get('/api-spec/files/')
    .expect(200, function (err, res) {
      expect(res.body).to.be.an('object');
      expect(res.body).to.contain.all.keys('path', 'name', 'type', 'children');
      expect(res.body).to.have.property('children').that.is.an('array');
      expect(res.body).to.have.property('children').with.length(2);
      expect(res.body.children[0]).to.contain.all.keys('path', 'name', 'type');
      expect(res.body.children[1]).to.contain.all.keys('path', 'name', 'type');
      done();
    });
  });

  it('should allow load(), retrieve a .raml file content', function (done) {
    request(app)
    .get('/api-spec/files/test.raml')
    .expect(200, /\%RAML/, done);
  });

  describe('remove functionality', function () {
    it('should delete a specific directory', function (done) {
      let testPath = path.resolve(__dirname, '..', 'RAML', 'anotherfolder');
      fs.mkdirSync(testPath);

      request(app)
      .delete('/api-spec/files/anotherfolder')
      .expect(200)
      .end(function () {
        expect(fs.readdirSync.bind(null, testPath)).to.throw(/ENOENT/);
        done();
      });
    });

    it('should delete a nested directory', function (done) {
      let testPath = path.resolve(__dirname, '..', 'RAML', 'anotherfolder');
      let testPath2 = path.resolve(__dirname, '..', 'RAML', 'anotherfolder', 'nestedmore');
      fs.mkdirSync(testPath);
      fs.mkdirSync(testPath2);

      request(app)
      .delete('/api-spec/files/anotherfolder')
      .expect(200)
      .end(function () {
        expect(fs.readdirSync.bind(null, testPath2)).to.throw(/ENOENT/);
        expect(fs.readdirSync.bind(null, testPath)).to.throw(/ENOENT/);
        done();
      });
    });

    it('should delete a specific file', function (done) {
      let testFile = path.resolve(__dirname, '..', 'RAML', 'randomSpec.raml');

      fs.writeFileSync(testFile, 'BLABLABLA');
      request(app)
      .delete('/api-spec/files/randomSpec.raml')
      .expect(200)
      .end(function () {
        expect(fs.readFileSync.bind(null, testFile)).to.throw(/ENOENT/);
        done();
      });
    });
  });

  it('should allow rename(), rename randomSpec.raml => goodfile.raml', function (done) {
    let sourceFile = path.resolve(__dirname, '..', 'RAML', 'randomSpec.raml');
    let destFile = path.resolve(__dirname, '..', 'RAML', 'goodfile.raml');

    fs.writeFileSync(sourceFile, 'BLABLABLA');
    request(app)
    .put('/api-spec/files/randomSpec.raml')
    .send({ rename: '/goodfile.raml' })
    .expect(200)
    .end(function () {
      expect(fs.readFileSync(destFile)).to.be.instanceof(Buffer);
      fs.unlinkSync(destFile);
      done();
    });
  });

  it('should allow createFolder(), create RAML/newdir', function (done) {
    let testPath = path.resolve(__dirname, '..', 'RAML', 'anotherfolder');

    request(app)
    .post('/api-spec/files/anotherfolder')
    .send({ type: 'folder' })
    .expect(200)
    .end(function () {
      expect(fs.readdirSync(testPath)).to.be.an('array');
      fs.rmdirSync(testPath);
      done();
    });
  });

  it('should allow save(), writing RAML/demoapi.raml', function (done) {
    let testFile = path.resolve(__dirname, '..', 'RAML', 'demoapi.raml');

    request(app)
    .post('/api-spec/files/demoapi.raml')
    .send({ type: 'file', content: '#%RAML 0.8\ntitle: demoapi\n\n/resources:\n  get:\n  post:' })
    .expect(200)
    .end(function () {
      expect(fs.readFileSync(testFile).toString()).to.match(/title\: demo/);
      fs.unlinkSync(testFile);
      done();
    });
  });

});
