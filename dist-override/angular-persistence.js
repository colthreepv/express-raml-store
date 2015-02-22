// gently stolen from: https://github.com/arthurtsang/api-designer/commit/2ad4f3e253b17fa95ea3ea012419d933b098d914
// just linted and indented
angular.module('ramlEditorApp')
.factory('RamlServeFS', function($http, $q, config) {
  var service = {};

  function errorFunction(data, status, headers, config) {
    alert(status + ': ' + data);
  }

  service.directory = function(path) {
    var deferred = $q.defer();

    if (path === '/') {
      deferred.resolve({
        path: '/',
        name: '/',
        type: 'folder',
        children: [
          {
            path: '/api.raml',
            name: 'api.raml',
            type: 'file'
          },
          {
            path: '/test.raml',
            name: 'test.raml',
            type: 'file'
          }
        ]
      });
    }
    if (path === '/api.raml') {
      deferred.resolve({
        path: '/api.raml',
        name: 'api.raml',
        type: 'file'
      });
    }
    // $http({
    //     method: 'GET',
    //     data: '',
    //     url: 'files/' + ((path === '/') ? '' : path),
    //     withCredentials: false
    //   }).success(function(data) {
    //     deferred.resolve({
    //       path: path,
    //       meta: {},
    //       children: data
    //     });
    //   })
    //   .error(errorFunction);
    return deferred.promise;
  };

  service.load = function(path, name) {
    var deferred = $q.defer();
    if (path.endsWith('.meta')) {
      deferred.resolve('{ "created": "' + Date.now() + '" }');
    }
    if (path.endsWith('.raml')) {
      deferred.resolve('#%RAML 0.8\ntitle: tutored private api\nversion: 0.1.0\nbaseUri: http://localhost:8080/api\nmediaType: application/json\nschemas:\n  - ParseId: |\n      {\n        "type": "string",\n        "minLength": 10,\n        "maxLength": 10\n      }\n  - Lesson: |\n      {\n        "definitions": {\n          "parseId": {\n            "type": "string",\n            "minLength": 10,\n            "maxLength": 10\n          }\n        },\n        "type": "object",\n        "properties": {\n          "tutor": { "$ref": "#/definitions/parseId" },\n          "student": { "$ref": "#/definitions/parseId" }\n        }\n      }\nprotocols: [ HTTP ]\n/lesson:\n  post:\n    description: "creates a new lesson: a student books a lesson with a tutor"\n    body:\n      application/json:\n        schema: Lesson\n        example: |\n          {\n            "tutor": "asd0masd01",\n            "student": "asd0masd02"\n          }\n    responses:\n      200:\n        description: everything went well!\n        body:\n          application/json:\n            example: |\n              { "message": "everything done" }\n');
    }

    // $http({
    //     method: 'GET',
    //     data: '',
    //     url: 'files/' + path,
    //     withCredentials: false
    //   }).success(function(data) {
    //     deferred.resolve(data[0].content);
    //   })
    //   .error(deferred.reject.bind(deferred));
    return deferred.promise;
  };

  service.remove = function(path, name) {
    var deferred = $q.defer();
    // $http({
    //   method: 'DELETE',
    //   data: '',
    //   url: 'files/' + path,
    //   withCredentials: false
    // }).success(function(data) {
    deferred.resolve();
    // }).error(deferred.reject.bind(deferred));
    return deferred.promise;
  };

  service.rename = function(source, destination) {
    var deferred = $q.defer();
    // $http({
    //   method: 'PUT',
    //   data: {
    //     action: 'rename',
    //     newName: destination
    //   },
    //   url: 'files/' + source,
    //   withCredentials: false
    // }).success(function(data) {
    deferred.resolve();
    // }).error(deferred.reject.bind(deferred));
    return deferred.promise;
  };

  service.createFolder = function(path) {
    var deferred = $q.defer();
    // $http({
    //   method: 'POST',
    //   data: {
    //     type: 'folder'
    //   },
    //   url: 'files/' + path,
    //   withCredentials: false
    // }).success(function(data) {
    deferred.resolve();
    // }).error(deferred.reject.bind(deferred));
    return deferred.promise;
  };

  service.save = function(path, contents) {
    var deferred = $q.defer();
    // $http({
    //   method: 'POST',
    //   data: {
    //     type: 'file',
    //     content: contents
    //   },
    //   url: 'files/' + path,
    //   withCredentials: false
    // }).success(function(data) {
    deferred.resolve();
    // }).error(deferred.reject.bind(deferred));
    return deferred.promise;
  };

  return service;
})
.run(function (RamlServeFS, config) {
  // Set RamlServeFS as the filesystem to use
  config.set('fsFactory', 'RamlServeFS');
});
