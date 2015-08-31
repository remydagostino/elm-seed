var Bluebird = require('bluebird');
var morgan = require('morgan');


module.exports = function(deps) {
  var builder = deps.builder;

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
          .then(
            function() {
              next();
            },
            function(err) {
              // Todo: package the errors up nice and display them
              next(err);
            }
          )
        );
      });

      return server;
    };
  }

  return {
    devStack: devStack
  };
};
