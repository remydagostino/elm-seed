var _ = require('lodash');
var Bluebird = require('bluebird');
var morgan = require('morgan');
var fs = require('fs');
var path = require('path');


module.exports = function(deps) {
  var builder = deps.builder;
  var templateDir = deps.templateDir;

  var elmErrorTemplate = path.join(templateDir, 'elm-errors.html');

  function devStack(config) {
    return function(server) {
      var lastBuild = Bluebird.resolve(0);

      server.use(morgan('dev'));

      server.get('/', function(req, res, next) {
        lastBuild = (
          lastBuild
          .then(function(lastTime) {
            var currentTime = Date.now();

            return (
              builder.build(config, true, lastTime)
              .then(function() {
                return currentTime;
              })
            );
          })
          .then(function() {
            next();
          })
          .catch(
            function(err) {
              return err.type === 'elm-compile';
            },
            function(err) {
              return sendFormattedErrors(res, elmErrorTemplate, err.errors);
            }
          )
          .catch(function(err) {
            next(err);
          })
        );
      });

      return server;
    };
  }

  function sendFormattedErrors(res, template, errors) {
    return loadErrorTemplate(elmErrorTemplate, errors)
    .then(function(html) {
      res.set('Content-Type', 'text/html');
      res.send(html);
    });
  }

  function loadErrorTemplate(templatePath, errors) {
    return Bluebird.promisify(fs.readFile)(templatePath)
    .then(function(fileContents) {
      return _.template(fileContents)({ errors: errors });
    });
  }

  return {
    devStack: devStack
  };
};
