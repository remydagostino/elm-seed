var Bluebird = require('bluebird');

module.exports = function(deps) {
  var elmCompile = deps.elmCompile;
  var htmlBuild = deps.htmlBuild;
  var jsCompile = deps.jsCompile;
  var cssCompile = deps.cssCompile;

  // Todo: Only build files changed since timestamp
  function build(config, devBuild, since) {
    var buildDir = config.buildDir;
    var buildLevel = devBuild ? 'devBuild' : 'build';

    return (
      elmCompile[buildLevel](buildDir, config.elm)
      .catch(function(err) {
        return Bluebird.reject({
          type: 'elm-compile',
          errors: err
        });
      })
      .then(function() {
        return htmlBuild[buildLevel](
          buildDir,
          config.htmlPath,
          {
            title: config.name,
            useCustomJs: Boolean(config.js),
            cssPath: config.css && config.css.main
          }
        );
      })
      .then(function() {
        if (config.js) {
          return jsCompile[buildLevel](buildDir, config.js);
        }
      })
      .then(function() {
        if (config.css) {
          return cssCompile[buildLevel](buildDir, config.css);
        }
      })
    );
  }

  return {
    build: build
  };
};
