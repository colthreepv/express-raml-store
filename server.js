var express = require('express'),
    files = require('./routes/files');

var app = express();

app.configure(function() {
    app.set('port', process.env.RAML_PORT || 3000);
    app.use(express.logger('dev')); /* 'default', 'short', 'tiny', 'dev' */
    app.use(express.bodyParser());
    app.use(express.errorHandler({
        dumpExceptions: true,
        showStack: true
    }));
    app.use('/', express.static(__dirname + '/node_modules/api-designer/dist'));
    app.use(app.router);
});

app.use(express.methodOverride());

// ## CORS middleware
//
// see: http://stackoverflow.com/questions/7067966/how-to-allow-cors-in-express-nodejs
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
        res.send(200);
    } else {
        next();
    }
};

app.use(allowCrossDomain);

app.get('/files/*', files.findAll);
app.post('/files/*', files.addFile);
app.put('/files/*', files.updateFile);
app.delete('/files/*', files.deleteFile);

app.listen(app.get("port"));
console.log('Listening on port ' + app.get("port") + '...');