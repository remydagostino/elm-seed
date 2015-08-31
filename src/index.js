/*eslint-env node*/

var _ = require('lodash');
var Bluebird = require('bluebird');
var childProcess = require('child_process');
var uglify = require('uglify-js');
var path = require('path');
var files = require('./util/files');

var projectRoot = path.join(__dirname, '..');

var elmCompile = require('./build/elm-compile')({
  spawn: childProcess.spawn,
  env: process.env,
  writeFile: files.writeFile,
  jsMinify: function(filePath) {
    return new Bluebird.Promise(function(resolve) {
      return resolve(uglify.minify(filePath));
    });
  }
});

var cleanBuild = require('./build/clean')({
  removeDir: files.removeDir,
  createDir: files.createDir
});

var htmlBuild = require('./build/html-build')({
  readFile: files.readFile,
  writeFile: files.writeFile
});

var jsCompile = require('./build/js-compile')({
  browserify: require('browserify'),
  writeFile: files.writeFile
});

var server = require('./server/core')();

module.exports = {
  build: build,
  serveDev: serveDev,
  serve: serve
};

function build(options) {
  var buildDir = options.buildDir;
  var elmDir = options.elmDir;

  validateOptions(options);

  return cleanBuild.clean(buildDir)
    .then(function() {
      return elmCompile.build(elmDir, buildDir);
    })
    .then(function() {
      return htmlBuild.build(
        buildDir,
        options.htmlPath || path.join(projectRoot, 'templates', 'index.html'),
        { useCustomJs: Boolean(options.jsDir) }
      );
    })
    .then(function() {
      if (options.jsDir) {
        return jsCompile.build(buildDir, options.jsDir);
      }
    });
}

function serveDev() {

}

function serve(options) {
  validateOptions(options);

  return server.start(
    options.port,
    [
      server.productionStack,
      server.serveAssets(options.buildDir, Boolean(options.jsDir))
    ]
  );
}

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
}
