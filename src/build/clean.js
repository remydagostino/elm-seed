var path = require('path');

/**
 * Module generating function, requires dependencies to be injected
 *
 * @param  {Function} removeDir (String) -> Promise
 * @param  {Function} createDir (String) -> Promise
 */
module.exports = function(deps) {
  var removeDir = deps.removeDir;
  var createDir = deps.createDir;

  function clean(buildDir) {
    var normalizedBuildDir = path.normalize(buildDir);

    return removeDir(normalizedBuildDir)
    .then(function() {
      return createDir(normalizedBuildDir);
    })
    .then(function() {
      return createDir(path.join(normalizedBuildDir, 'static'));
    });
  }

  return {
    clean: clean
  };
};
