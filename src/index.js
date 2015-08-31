/*eslint-env node*/

var _ = require('lodash');
var Bluebird = require('bluebird');
var childProcess = require('child_process');
var uglify = require('uglify-js');
var path = require('path');
var files = require('./util/files');

var projectRoot = path.join(__dirname, '..');

var builder = require('./build/build')({
  elmCompile: require('./build/elm-compile')({
    spawn: childProcess.spawn,
    env: process.env,
    writeFile: files.writeFile,
    jsMinify: function(filePath) {
      return new Bluebird.Promise(function(resolve) {
        return resolve(uglify.minify(filePath));
      });
    }
  }),

  htmlBuild: require('./build/html-build')({
    readFile: files.readFile,
    writeFile: files.writeFile
  }),

  jsCompile: require('./build/js-compile')({
    browserify: require('browserify'),
    writeFile: files.writeFile
  })
});

var cleanBuild = require('./build/clean')({
  removeDir: files.removeDir,
  createDir: files.createDir
});

var server = require('./server/core')();
var devServer = require('./server/dev')({ builder: builder });

var build = _.flow(validateOptions, function(options) {
  return (
    cleanBuild.clean(options.buildDir)
    .then(function() {
      return builder.build(options, false, 0);
    })
  );
});

var serveDev = _.flow(validateOptions, function(options) {
  return cleanBuild.clean(options.buildDir)
    .then(function() {
      return server.start(
        options.port,
        [
          devServer.devStack(options),
          server.serveAssets(options.buildDir, Boolean(options.jsDir))
        ]
      );
    });
});

var serve = _.flow(validateOptions, function(options) {
  return server.start(
    options.port,
    [
      server.productionStack,
      server.serveAssets(options.buildDir, Boolean(options.jsDir))
    ]
  );
});

function validateOptions(options) {
  if (!options.buildDir || !_.isString(options.buildDir)) {
    throw new Error('buildDir (string) is required');
  }

  if (!path.isAbsolute(options.buildDir)) {
    throw new Error('buildDir must be an absolute path');
  }

  if (!options.elmDir || !_.isString(options.elmDir)) {
    throw new Error('elmDir (string) is required');
  }

  if (!options.port || !_.isNumber(options.port)) {
    throw new Error('port (number) is required');
  }

  return _.defaults(
    _.clone(options),
    {
      htmlPath: path.join(projectRoot, 'templates', 'index.html')
    }
  );
}

module.exports = {
  build: build,
  serveDev: serveDev,
  serve: serve
};
