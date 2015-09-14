var _ = require('lodash');
var path = require('path');
var Bluebird = require('bluebird');
var fs = require('fs');
var os = require('os');
var highlight = require('../util/highlight');
var parse = require('../util/parse');

/**
 * Module generating function, requires dependencies to be injected
 *
 * @param  {Function} spawn     (binaryPath, args, options) => ChildProcess
 * @param  {Object}   env       Environment that the spawn should execute within
 * @param  {Function} writeFile (destinationPath, content) => Promise
 * @param  {Function} jsMinify  (filePath) => Promise<{ code: string }>
 */
module.exports = function(deps) {
  var spawn = deps.spawn;
  var env = deps.env;
  var writeFile = deps.writeFile;
  var jsMinify = deps.jsMinify;

  /**
   * Builds and writes compiled elm source to the file system where they can be
   * served.
   *
   * @param  {Boolean} devBuild    True = minify compiled files
   * @param  {String} buildPath    Path to the build directory
   * @param  {Object} elmOptions
   * @return {Promise}             Resolves with an empty object
   */
  function build(devBuild, buildPath, elmOptions) {
    var elmMainFile = path.join(elmOptions.dir, elmOptions.main);
    var targetFile = path.join(buildPath, 'elm.js');
    var uncompressedTarget = path.join(buildPath, 'elm-uncompressed.js');

    if (devBuild) {
      return compile(elmOptions.bin, elmMainFile, targetFile);
    } else {
      return compile(elmOptions.bin, elmMainFile, uncompressedTarget)
      .then(function() {
        return jsMinify(uncompressedTarget);
      })
      .then(function(minified) {
        return writeFile(targetFile, minified.code);
      })
      .catch(function(err) {
        return Bluebird.reject({ message: err.message });
      });
    }
  }

  /**
   * Compiles elm source files to a destination file.
   *
   * @param  {String} src      Path to the elm main source file
   * @param  {String} output   Path to the destination file
   * @return {Promise}         Resolves with an empty object when complete
   */
  function compile(elmBins, src, output) {
    return new Bluebird.Promise(function(resolve, reject) {
      var proc = spawnElmCompiler(elmBins, src, output);
      var results = '';

      proc.stdout.on('data', function(data) {
        results += data;
      });

      proc.on('close', function(exitCode) {
        if (exitCode === 0) {
          resolve();
        } else {
          getErrorContent(results).then(reject, reject);
        }
      });
    });
  }

  function getErrorContent(errorString) {
    return new Bluebird.Promise(function(resolve) {
      // Todo: figure out why Elm's output is in such a weird format
      resolve(parse.multipleArrays(errorString));
    })
    .then(function(errors) {
      return Bluebird.all(errors.map(expandElmError));
    })
    .catch(function() {
      return [{
        type: 'unknown',
        message: errorString
      }];
    });
  }

  function expandElmError(error) {
    return Bluebird.promisify(fs.readFile)(error.file, 'utf8')
    .then(function(fileContents) {
      var fileLines = fileContents.split(os.EOL);

      return _.defaults(
        {
          lines: highlight.lines(
            fileLines,
            error.region,
            error.subregion || error.region
          )
        },
        error
      );
    })
    .catch(function(err) {
      return _.defaults({ lines: null }, error);
    });
  }

  /**
   * Spawns the elm compiler
   */
  function spawnElmCompiler(elmBins, source, outputPath) {
    var processArgs = [
      source,
      '--yes',
      '--report=json',
      // '--warn',
      '--output', outputPath.replace(/ /g, '\\ ')
    ];

    return spawn(
      elmBins['elm-make'],
      processArgs,
      {
        env: _.merge({LANG: 'en_US.UTF-8'}, env),
        stdio: 'pipe'
      }
    );
  }

  // Module interface
  return {
    build: build.bind(null, false),
    devBuild: build.bind(null, true)
  };
};
