var _ = require('lodash');
var compression = require('compression');
var express = require('express');
var morgan = require('morgan');
var path = require('path');
var Bluebird = require('bluebird');

module.exports = function() {
  function start(port, middleware) {
    var app = _.reduce(
      middleware,
      function(memo, ware) {
        return ware(memo);
      },
      express()
    );

    // Prevent errors from leaking
    app.use(function(err, req, res, next) {
      if (err.message && !err.stack) {
        console.error(err.message); //eslint-disable-line
      } else if (err.stack) {
        console.error(err.stack); //eslint-disable-line
      } else {
        console.error('unknown error', err); //eslint-disable-line
      }

      res.sendStatus(500);
    });

    return new Bluebird.Promise(function(resolve) {
      var server = app.listen(port, function() {
        resolve(server);
      });
    });
  }

  function productionStack(server) {
    server.use(morgan('common'));
    server.use(compression());

    return server;
  }

  function serveAssets(buildDir, useCustomJs, useCss) {
    return function(server) {
      server.use('/static',   express.static(path.join(buildDir, 'static')));

      if (useCss) {
        server.use('/styles', express.static(path.join(buildDir, 'styles')));
      }

      if (useCustomJs) {
        server.get('/main.js', serveFile(path.join(buildDir, 'main.js')));
      }

      server.get('/elm.js',   serveFile(path.join(buildDir, 'elm.js')));
      server.get('/',         serveFile(path.join(buildDir, 'index.html')));

      return server;
    };
  }

  function serveFile(file) {
    return function(req, res) {
      res.sendFile(file);
    };
  }

  return {
    start: start,
    productionStack: productionStack,
    serveAssets: serveAssets
  };
};
