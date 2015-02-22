var express = require('express');
var debug = require('debug')('raml-serve');

var path = require('path');

// creates dist-override/index.html
var fs = require('fs');
var indexFile = fs.readFileSync(path.join(__dirname, 'node_modules/api-designer/dist/index.html'), 'utf8');
indexFile = indexFile.replace(/<\/body\>/g, '<script src="angular-persistence.js"></script></body>');
fs.writeFileSync('dist-override/index.html', indexFile, 'utf8');

function serveOverride (req, res, next) {
  if (req.url === '/index.html' || req.url === '/') {
    return res.sendFile('/index.html', { root: 'dist-override' });
  }
  if (req.url === '/angular-persistence.js') {
    return res.sendFile('/angular-persistence.js', { root: 'dist-override' });
  }
  var requestedFile = req.url.replace(/\?.*/, '');
  debug('requested:', requestedFile);
  res.sendFile(requestedFile, { root: 'node_modules/api-designer/dist' }, function (err) {
    if (!!err && err.code === 'ENOENT') return res.sendStatus(404);
    if (!!err) {
      console.log('unexpected error happened');
      console.log(err.stack);
      return res.sendStatus(500);
    }
  });
}

var ramlServe;
module.exports = ramlServe = function (ramlPath) {
  var router = express.Router();
  var bodyParser = require('body-parser');
  // quick n dirty = setup RAML_DATAPATH without refactoring files.js
  process.env.RAML_DATAPATH = ramlPath;
  var files = require('./routes/files');

  router.use(bodyParser.json());
  router.get('/files/*', files.findAll);
  router.post('/files/*', files.addFile);
  router.put('/files/*', files.updateFile);
  router.delete('/files/*', files.deleteFile);
  router.use('/', serveOverride);
  return router;
};

if (module.parent === null) {
  var app = express();
  app.use('/', ramlServe('RAML/'));

  var server = app.listen(process.env.PORT || 3000, function() {
    console.log('Express server listening on ' + server.address().address + ':' + server.address().port + '/');
  });
}
