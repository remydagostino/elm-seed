var streams = require('../util/streams');
var path = require('path');
var uglify = require('uglify-js');
var Bluebird = require('bluebird');

/**
 * Module generating function, requires dependencies to be injected
 *
 * @param  {Function} browserify   (filePath) => BrowserifyInstance
 * @param  {Function} writeToFile  (filePath, content) => Promise
 */
module.exports = function(deps) {
  var browserify = deps.browserify;
  var writeFile = deps.writeFile;

  function build(devBuild, buildDir, options) {
    var mainJsPath = path.join(options.dir, options.main);

    return streams.drain(browserify(mainJsPath).bundle())
      .then(function(js) {
        return devBuild ? js : minifyJs(js);
      })
      .then(function(finalJs) {
        return writeFile(path.join(buildDir, 'main.js'), finalJs);
      });
  }

  function minifyJs(content) {
    return new Bluebird.Promise(function(resolve) {
      resolve(
        uglify.minify(content, { fromString: true}).code
      );
    });
  }

  return {
    build: build.bind(null, false),
    devBuild: build.bind(null, true)
  };
};
