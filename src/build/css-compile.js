var streams = require('../util/streams');
var path = require('path');
var uglify = require('uglify-js');
var Bluebird = require('bluebird');

var postcss = require('postcss');
var postcssImport = require('postcss-import');
var autoprefixer = require('autoprefixer-core');
var cssnano = require('cssnano');

/**
 * Module generating function, requires dependencies to be injected
 *
 * @param  {Function} copyDir  (sourceDir, destDir, options) => Promise
 */
module.exports = function(deps) {
  var copyDir = deps.copyDir;

  function build(devBuild, buildDir, cssDir) {
    var cssDest = path.join(buildDir, 'styles')

    return copyDir(
      cssDir,
      cssDest,
      {
        // Include all folders and all css files
        filter: /\/\w+(?!\.)$|\.css$/,
        transform: function(contents, file) {
          return compileFile(devBuild, cssDest, cssDir, contents, file);
        }
      }
    );
  }

  function compileFile(devBuild, cssDest, cssDir, cssContent, file) {
    // Todo: investigate why postcss's promise doesn't seem to work
    return new Bluebird.Promise(function(resolve, reject) {
      var compiler = postcss();

      compiler.use(postcssImport());
      compiler.use(autoprefixer({ browsers: ['> 1%'] }));

      if (!devBuild) {
        compiler.use(cssnano({ autoprefixer: false }));
      }

      compiler
        .process(
          cssContent,
          {
            from: path.join(file.name),
            to: path.join(cssDest, path.relative(cssDir, file.name))
          }
        )
        .then(
          function(result) { resolve(result.css); },
          function(err)    { reject(err) }
        )
    });
  }


  return {
    build: build.bind(null, false),
    devBuild: build.bind(null, true)
  };
};
