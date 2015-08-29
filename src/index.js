/*eslint-env node*/

var _ = require('lodash');
var Bluebird = require('bluebird');
var fs = require('fs');
var childProcess = require('child_process');
var rimraf = require('rimraf');
var uglify = require('uglify');

var elmCompile = require('./build/elm-compile')({
  spawn: childProcess.spawn,
  env: process.env,
  writeFile: Bluebird.promisify(fs.writeFile),
  jsMinify: function(filePath) {
    return Bluebird(function(resolve) {
      return uglify.minify(filePath);
    });
  }
});

var cleanBuild = require('./build/clean-build')(
  Bluebird.promisify(rimraf),
  Bluebird.promisify(fs.mkdir)
);

module.exports = {
  build: build,
  devServer: devServer,
  server: server
};

function build(options) {
  var buildDir = options.buildDir;
  var elmDir = options.elmDir;

  if (!buildDir || !_.isString(buildDir)) {
    throw new Error('buildDir (string) is required');
  }

  if (!elmDir || !_.isString(elmDir)) {
    throw new Error('elmDir (string) is required');
  }

  return cleanBuild.clean(buildDir)
    .then(function() {
      return elmCompile.build(elmDir, buildDir);
    });
}

function devServer() {

}

function server() {

}
