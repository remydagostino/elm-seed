module.exports = function(deps) {
  var elmCompile = deps.elmCompile;
  var htmlBuild = deps.htmlBuild;
  var jsCompile = deps.jsCompile;

  // Todo: Only build files changed since timestamp
  function build(config, devBuild, since) {
    var buildDir = config.buildDir;
    var elmDir = config.elmDir;
    var htmlPath = config.htmlPath;
    var jsDir = config.jsDir;

    var buildLevel = devBuild ? 'devBuild' : 'build';

    return (
      elmCompile[buildLevel](elmDir, buildDir)
      .then(function() {
        return htmlBuild[buildLevel](
          buildDir,
          htmlPath,
          {
            useCustomJs: Boolean(jsDir),
            title: config.name
          }
        );
      })
      .then(function() {
        if (jsDir) {
          return jsCompile[buildLevel](buildDir, jsDir);
        }
      })
    );
  }

  return {
    build: build
  };
};
