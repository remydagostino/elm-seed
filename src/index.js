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
  }),

  cssCompile: require('./build/css-compile')({
    copyDir: files.copyDir
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
          server.serveAssets(options)
        ]
      );
    });
});

var serve = _.flow(validateOptions, function(options) {
  return server.start(
    options.port,
    [
      server.productionStack(options.server),
      server.serveAssets(options)
    ]
  );
});

function validateOptions(opt) {
  // Todo: replace with json schema validation
  if (!opt.buildDir || !_.isString(opt.buildDir)) {
    throw new Error('buildDir (string) is required');
  }

  if (!path.isAbsolute(opt.buildDir)) {
    throw new Error('buildDir must be an absolute path');
  }

  if (!(opt.port && _.isNumber(opt.port))) {
    throw new Error('port (number) is required');
  }

  if (!(opt.elm && _.isString(opt.elm.dir))) {
    throw new Error('elmDir (string) is required');
  }

  // Clone options and apply defaults
  return {
    name: opt.name,
    port: opt.port,

    routes: opt.routes || {},

    buildDir: opt.buildDir,
    htmlPath: opt.htmlPath || path.join(projectRoot, 'templates', 'index.html'),

    elm: {
      dir: opt.elm.dir,
      main: opt.elm.main || 'App.elm',
      test: opt.elm.test
    },

    js: !_.isObject(opt.js) ? null : {
      dir: opt.js.dir,
      main: opt.js.main || 'main.js'
    },

    css: !_.isObject(opt.css) ? null : {
      dir: opt.css.dir,
      main: opt.css.main,
      autoprefix: opt.css.autoprefix || ['> 1%'],
      useImports: _.has(opt.css, 'useImports') ? opt.css.useImports : true,
      useAssets: _.has(opt.css, 'useAssets') ? opt.css.useAssets : true
    },

    server: {
      logRequests: _.has(opt.css, 'logRequests')
        ? opt.css.logRequests
        : 'common'
    }
  };
}

module.exports = {
  build: build,
  serveDev: serveDev,
  serve: serve
};
