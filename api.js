'use strict';
// node libs
let fs = require('fs');
let path = require('path');
let url = require('url');

// deps
let mkdirp = require('mkdirp');
let rimraf = require('rimraf');

let debug = require('debug')('raml-store-api');

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
        if (!!err) {
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
    let result;
    // first promise reads content of a directory
    return new Promise(function (resolve, reject) {
      let absPath = path.join(ramlPath, reqPath);

      fs.readdir(absPath, function (err, files) {
        if (!!err) return reject(err);

        reqPath = (reqPath === '') ? '/' : reqPath;
        result = {
          path: reqPath,
          name: reqPath,
          type: 'folder',
          children: []
        };
        resolve(files);
      });
    })
    // then makes a stat() call for each file listed
    .then(function (files) {
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
    let reqPath = req.params[0];
    debug('getFn', 'reqPath', reqPath);
    // if (!!req.query.dir) {
    //   debug('asking for a directory');
    //   return listDirectory(reqPath)
    //   .then(function (content) {
    //     res.status(200).json(content);
    //   })
    //   .catch(next);
    // }

    stat(reqPath)
    .catch(function (notFound) {
      if (notFound === 'ENOENT') {
        res.status(404);
      }
      return false;
    })
    .then(function (content) {
      if (!!content.type && content.type === 'file') {
        return res.sendFile(reqPath, { root: path.join(__dirname, ramlPath) });
      }
      res.status(200).json(content);
    })
    .catch(next);
  }

  // creates file
  function postFn (req, res, next) {}
  function putFn (req, res, next) {}
  function deleteFn (req, res, next) {}

  return {
    get: getFn,
    post: postFn,
    put: putFn,
    delete: deleteFn
  };
};

// function browseFiles (reqPath, done) {
//   var dir = path.join(dataPath, reqPath);
//   var response = [];
//   fs.readdir(dir, function(err, list) {
//     debug('dirlisting', list);

//   });
// }

// exports.findAll = function (req, res, next) {
//   var reqPath = (req.params[0] === '/') ? '' : req.params[0];

// };

function getChildren (reqPath, callback) {

}



var walk = function(reqPath, done) {
  reqPath = reqPath || '.';
  debug('walking', reqPath);
  var dir = path.join(dataPath, reqPath);
  var result;
  fs.readdir(dir, function(err, list) {
    debug('dirlisting', list);
    if (err) {
      if (err.code === 'ENOTDIR') {
        results.push({
          path: reqPath,
          name: path.basename(reqPath),
          type: 'file'
        });
        return done(null, results);
      } else {
        return done(err);
      }
    }
    // requested path is a directory
    result = {
      path: (reqPath === '.') ? '/' : reqPath,
      name: (reqPath === '.') ? '/' : reqPath,
      type: 'folder',
      children: []
    };
    list.forEach(function (fileName) {
      var filePath = path.join(dir, fileName);
      fs.stat(filePath, function (err, stat) {
        if (stat.isDirectory()) {
          // TODO recurse?
        }
        // is a file
        result.children.push({
          path: result.path + fileName,
          name: fileName,
          type: 'file'
        });
      });
    });


    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(filename) {
      var file = path.join(dir, filename);
      fs.stat(file, function (err, stat) {
        if (stat && stat.isDirectory()) {
          debug('isDirectory:', file);
          var current = {
            path: reqPath + '/' + filename,
            name: filename,
            type: 'folder'
          };
          results.push(current);
          walk(path.join(reqPath, filename), function(err, res) {
            //results = results.concat(res);
            current.children = res;
            if (!--pending) done(null, results);
          });
        } else {
          debug(reqPath, filename, file, dir);
          results.push({
            path: (reqPath === '.') ? '/' : reqPath,
            name: (reqPath === '.') ? '/' : reqPath,
            type: 'folder',
            children: []
          })
          results.push({
            path: '/' + path.join(reqPath, filename),
            name: '/' + path.join(reqPath, filename),
            type: 'file'
              //content: fs.readFileSync(file,'utf-8')
          });
          if (!--pending) done(null, results);
        }
      });
    });
  });
};

exports.findAll = function(req, res) {
  debug('finding all files');
  var reqPath = (req.params[0] === '/') ? '' : req.params[0];

  walk(reqPath, function(err, result) {
    if (err) {
      debug(err);
      res.sendStatus(404);
    } else {
      if (result.length == 1) {
        fs.readFile(path.join(dataPath, result[0].path), {
          encoding: 'utf8'
        }, function(err, content) {
          res.header('Access-Control-Allow-Origin', '*');
          result[0].content = content;
          res.send(JSON.stringify(result));
        });
      } else {
        res.header('Access-Control-Allow-Origin', '*');
        res.send(JSON.stringify(result));
      }
    }
  });
};

exports.addFile = function(req, res) {
  var file = req.body;
  var reqPath = (req.params[0] === '/') ? '' : req.params[0];
  debug('Creating file: ' + reqPath);
  if (file.type === 'folder') {
    mkdirp(path.join(dataPath, reqPath), function(err) {
      if (!err) {
        res.header('Access-Control-Allow-Origin', '*');
        res.send(201);
      }
    });
  } else {
    var dir = path.dirname(reqPath);
    var name = path.basename(reqPath);
    debug('Adding file : ' + dir + '===' + reqPath + '--' + JSON.stringify(file));
    mkdirp(dir, function(err) {
      fs.writeFile(path.join(dataPath, reqPath), unescape(file.content), function(err) {
        if (err) {
          debug(err);
          res.sendStatus(500);
        } else {
          res.header('Access-Control-Allow-Origin', '*');
          res.sendStatus(201);
        }
      });
    });
  }

};

exports.deleteFile = function(req, res) {
  var reqPath = (req.params[0] === '/') ? '' : req.params[0];
  debug('Deleting file: ' + reqPath);
  rimraf(path.join(dataPath, reqPath), function(err) {
    if (err) {
      debug(err);
      res.send(500);
    } else {
      res.send(200);
    }
  });
};

exports.updateFile = function(req, res) {
  var reqPath = (req.params[0] === '/') ? '' : req.params[0];
  var dest = req.body.newName;
  debug('Updating file: ' + reqPath);
  fs.rename(path.join(dataPath, reqPath), path.join(dataPath, dest), function(err) {
    if (err) {
      debug(err);
      res.send(500);
    } else {
      res.send(200);
    }
  });
};
