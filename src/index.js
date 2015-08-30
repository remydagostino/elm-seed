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
    })
    .then(function() {
      return htmlBuild.build(
        buildDir,
        options.htmlPath || path.join(projectRoot, 'templates', 'index.html'),
        { useCustomJs: Boolean(options.jsDir) }
      );
    });
}

function devServer() {

}

function server() {

}
