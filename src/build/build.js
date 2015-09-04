module.exports = function(deps) {
  var elmCompile = deps.elmCompile;
  var htmlBuild = deps.htmlBuild;
  var jsCompile = deps.jsCompile;
  var cssCompile = deps.cssCompile;

  // Todo: Only build files changed since timestamp
  function build(config, devBuild, since) {
    var buildDir = config.buildDir;
    var elmDir = config.elmDir;
    var htmlPath = config.htmlPath;
    var jsDir = config.jsDir;
    var cssDir = config.cssDir;

    var buildLevel = devBuild ? 'devBuild' : 'build';

    return (
      elmCompile[buildLevel](elmDir, buildDir)
      .then(function() {
        return htmlBuild[buildLevel](
          buildDir,
          htmlPath,
          {
            useCustomJs: Boolean(jsDir),
            useCss: Boolean(cssDir),
            title: config.name
          }
        );
      })
      .then(function() {
        if (jsDir) {
          return jsCompile[buildLevel](buildDir, jsDir);
        }
      })
      .then(function() {
        if (cssDir) {
          return cssCompile[buildLevel](buildDir, cssDir);
        }
      })
    );
  }

  return {
    build: build
  };
};
