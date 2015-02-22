var fs = require('fs');
require('sugar');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var path = require('path');
var debug = require('debug')('files');

var dataPath = process.env.RAML_DATAPATH || './';
debug('dataPath', dataPath);

var walk = function(reqPath, done) {
  debug('walking ' + reqPath);
  var dir = path.join(dataPath, reqPath);
  var results = [];
  fs.readdir(dir, function(err, list) {
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
    var pending = list.length;
    if (!pending) return done(null, results);
    list.forEach(function(filename) {
      var file = dir + '/' + filename;
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
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
            path: path.join(reqPath, filename),
            name: path.join(reqPath, filename),
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

  var filelist = [];
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
