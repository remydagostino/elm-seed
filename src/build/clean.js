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
    return removeDir(buildDir)
    .then(function() {
      return createDir(buildDir);
    })
    .then(function() {
      return createDir(path.join(buildDir, 'static'));
    });
  }

  return {
    clean: clean
  };
};
