'use strict';
// node libs
var fs = require('fs');
var path = require('path');
var url = require('url');
var Promise = (!Promise) ? require('bluebird') : Promise;

// deps
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');

var debug = require('debug')('raml-store-api');

module.exports = function (ramlPath) {
  ramlPath = ramlPath || '.';
  debug('ramlPath', ramlPath);

  /**
   * stat returns a Promise resolving in either a listDirectory() call
   * or to the basename of reqPath passed
   * @param  {string} reqPath: file path relative to ramlPath
   * @return {Promise} resolving in an object containing folder (see listDirectory) or a string of the basename
   */
  function stat (reqPath) {
    return new Promise(function (resolve, reject) {
      fs.stat(path.join(ramlPath, reqPath), function (err, stat) {
        if (err) {
          if (err.code === 'ENOENT') {
            return reject(err.code);
          }
          return reject(err); // generate 500
        }

        if (stat.isDirectory()) {
          return resolve(listDirectory(reqPath));
        }

        if (stat.isFile()) {
          return resolve({
            path: url.resolve('/', reqPath),
            name: path.basename(reqPath),
            type: 'file'
          });
        }
      });
    });
  }

  function listDirectory (reqPath) {
    debug('listDirectory', 'reqPath', reqPath);
    // result of the call is referenced here
    var result;
    // first promise reads content of a directory
    return new Promise(function (resolve, reject) {
      var absPath = path.join(ramlPath, reqPath);

      fs.readdir(absPath, function (err, files) {
        if (err) return reject(err);

        var fixedPath = (reqPath.match(/^\//)) ? reqPath : url.resolve('/', reqPath);
        result = {
          path: fixedPath,
          name: fixedPath,
          type: 'folder',
          children: []
        };
        resolve(files);
      });
    })
    // then makes a stat() call for each file listed
    .then(function (files) {
      files = files.map(function (f) {
        return path.join(reqPath, f);
      });
      return Promise.all(files.map(stat));
    })
    // finally concatenate the array to result
    // childrenArray has a format like this:
    // [
    //  {
    //    path: '/file.raml',
    //    name: 'file.raml',
    //    type: 'file'
    //  },
    //  {
    //    path: '/directoryone',
    //    name: directoryone,
    //    type: 'folder',
    //    children: [ ... ]
    //  }
    // ]
    .then(function (childrenArray) {
      result.children = childrenArray;
      return result;
    });
  }

  // manages file and directory retrieval
  function getFn (req, res, next) {
    var reqPath = req.params[0];
    debug('getFn', 'reqPath', reqPath);

    stat(reqPath)
    .then(function (content) {
      if (!!content.type && content.type === 'file') {
        return res.sendFile(reqPath, { root: ramlPath });
      }
      res.status(200).json(content);
    }, function (err) {
      if (err === 'ENOENT') {
        return res.sendStatus(404);
      }
      next(err);
    });
  }

  // save/create file
  function postFn (req, res, next) {
    var body = req.body;
    var reqPath = req.params[0];
    debug('postFn', 'reqPath', reqPath);

    if (body.type === 'folder') {
      mkdirp(path.join(ramlPath, reqPath), function (err) {
        if (err) return next(err);
        res.sendStatus(201);
      });
      return;
    }

    fs.writeFile(path.join(ramlPath, reqPath), body.content, function (err) {
      if (err) return next(err);
      res.sendStatus(201);
    });
  }

  // rename file/folder
  function putFn (req, res, next) {
    var reqPath = req.params[0];
    var destination = req.body.rename;
    debug('putFn', 'reqPath', reqPath);

    fs.rename(path.join(ramlPath, reqPath), path.join(ramlPath, destination), function (err) {
      if (err) return next(err);
      res.sendStatus(200);
    });
  }

  // removes dir/file
  function deleteFn (req, res, next) {
    var reqPath = req.params[0];
    debug('deleteFn', 'reqPath', reqPath);

    rimraf(path.join(ramlPath, reqPath), function (err) {
      if (err) return next(err);
      res.sendStatus(200);
    });
  }

  return {
    get: getFn,
    post: postFn,
    put: putFn,
    delete: deleteFn
  };
};
