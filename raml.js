var express = require('express'),
    router = express.Router();
var static = require('serve-static');
var files = require('./routes/files');
var debug = require('debug')('raml-serve');

var path = require('path');

var fs = require('fs');
fs.readFile(path.join(__dirname, 'node_modules/api-designer/dist/index.html'), 'utf8', function (err,data) {
  if (!!err) { return console.log(err); }
  var result = data.replace(/<\/body\>/g, '<script src="angular-persistence.js"></script></body>');

  fs.writeFile('dist-override/index.html', result, 'utf8', function (err) {
    if (err) return console.log(err);
    console.log('index.html written');
  });
});

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

router.get('/files/*', files.findAll);
router.post('/files/*', files.addFile);
router.put('/files/*', files.updateFile);
router.delete('/files/*', files.deleteFile);
router.use('/', serveOverride);

module.exports = router;

if (module.parent === null) {
  var app = express();
  app.use('/', router);

  var server = app.listen(app.get('port') || 3000, function() {
    console.log('Express server listening on ' + server.address().address + ':' + server.address().port + '/');
  });
}
