var fs = require('fs');
require('sugar');
var mkdirp = require('mkdirp');
var rimraf = require('rimraf');
var debug = require('debug')('files');

var dataPath = process.env.RAML_DATAPATH || './';
if (!dataPath.endsWith('/')) dataPath += '/';

var walk = function(path, done) {
  debug( 'walking ' + path );
  var dir = dataPath + path;
  var results = [];
  fs.readdir(dir, function(err, list) {
    if (err) { 
      if( err.code === 'ENOTDIR' ) {
          results.push({
            path: path,
            name: require('path').basename(path),
            type: 'file'
          });
          return done(null,results);
      }
      else {
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
            path: path + '/' + filename ,
            name: filename,
            type: 'folder'
          };
          results.push(current);
          walk(path+'/'+filename, function(err, res) {
            //results = results.concat(res);
            current.children = res;
            if (!--pending) done(null, results);
          });
        } else {
          debug( path, filename, file, dir );
          results.push({
            path: path + '/' + filename,
            name: path + '/' + filename,
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
  var path = (req.params[0]==='/')?'':req.params[0];

  walk( path, function(err, result) {
    if (err) {
      debug(err);
      res.sendStatus(404);
    } else {
      if( result.length == 1 ) {
        fs.readFile(dataPath + result[0].path, {
          encoding: 'utf8'
        }, function(err,content){
          res.header("Access-Control-Allow-Origin", "*");
          result[0].content = content;
          res.send(JSON.stringify(result));
        })
      } else {
        res.header("Access-Control-Allow-Origin", "*");
        res.send(JSON.stringify(result));
      }
    }
  });
}

exports.addFile = function(req, res) {
  var file = req.body;
  var path = (req.params[0]==='/')?'':req.params[0];
  debug('Creating file: ' + path);
  if( file.type === 'folder' ) {
    mkdirp( dataPath + '/' + path, function(err){
      if(!err){
        res.header("Access-Control-Allow-Origin", "*");
        res.send(201);
      }
    });
  } else {
    var dir = require('path').dirname(path);
    var name = require('path').basename(path);
    debug('Adding file : ' + dir + '===' + path + '--' + JSON.stringify(file));
    mkdirp('/'+dir, function(err) {
      fs.writeFile(dataPath+path,unescape(file.content),function(err){
        if(err){
          debug(err);
          res.sendStatus(500);
        } else {
          res.header("Access-Control-Allow-Origin", "*");
          res.sendStatus(201);
        }
      });
    });  
  }
  
}

exports.deleteFile = function(req, res) {
  var path = (req.params[0]==='/')?'':req.params[0];
  debug('Deleting file: ' + path);
  rimraf( dataPath + path, function(err){
    if(err){
      debug(err);
      res.send(500);
    }else{
      res.send(200);
    }
  });
}

exports.updateFile = function(req,res) {
  var path = (req.params[0]==='/')?'':req.params[0];
  var dest = req.body.newName;
  debug('Updating file: ' + path);
  fs.rename( dataPath+path, dataPath+dest, function(err){
    if(err){
      debug(err);
      res.send(500);
    } else {
      res.send(200);
    }
  });
}