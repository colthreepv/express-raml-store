# express-raml-store
fork of [arthurtsang/raml-store](https://github.com/arthurtsang/raml-store), that is a fork of [brianmc/raml-store](https://github.com/brianmc/raml-store).  
Is an Express module serving the awesome work of [mulesoft](https://github.com/mulesoft)/[api-designer](https://github.com/mulesoft/api-designer)  

Instead of saving to mongodb, it saves to the filesystem directly, exportes an handy [Express 4 Router](http://expressjs.com/guide/routing.html#express-router) that you can mount on your desired endpoint

# what
This package is meant to be mounted on your development server, allowing you to edit the API spec on-the-fly and ALSO test it (since you will have your development api server up!)

# how to use
Just include the module and specify the directory where you desire to host RAML files.

```javascript
var app = require('express');
var ramlServe = require('express-raml-store');

app.use('/raml-store', ramlServe('api-spec/raml/'));
app.listen(3000);
```

express-raml-store also works as stand-alone:

```shell
$ RAML_DATAPATH=api-spec/raml/ node raml-serve.js
```
