var _ = require('lodash');
var path = require('path');
var Bluebird = require('bluebird');
var htmlMinify = require('html-minifier');

/**
 * Module generating function, requires dependencies to be injected
 *
 * @param  {Function} readFile   (filePath) => Promise
 * @param  {Function} writeFile  (filePath, content) => Promise
 */
module.exports = function(deps) {
  var readFile = deps.readFile;
  var writeFile = deps.writeFile;

  function build(devBuild, buildPath, templatePath, extraArgs) {
    var templateArgs = _.defaults({ devBuild: devBuild }, extraArgs);

    return readFile(templatePath)
    .then(processTemplate.bind(null, templateArgs))
    .then(function(contents) {
      return devBuild ? Bluebird.resolve(contents) : minifyHtml(contents);
    })
    .then(function(transformedContent) {
      return writeFile(path.join(buildPath, 'index.html'), transformedContent);
    });
  }

  function processTemplate(args, content) {
    return new Bluebird.Promise(function(resolve, reject) {
      try {
        resolve(_.template(content)(args));
      } catch (ex) {
        reject(new Error('Template error: ' + ex.message));
      }
    });
  }

  function minifyHtml(htmlContent) {
    return new Bluebird.Promise(function(resolve) {
      resolve(htmlMinify.minify(htmlContent, {
        minifyCSS: true,
        collapseWhitespace: true
      }));
    });
  }

  return {
    build: build.bind(null, false),
    devBuild: build.bind(null, true)
  };
};
