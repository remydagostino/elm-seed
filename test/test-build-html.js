/*eslint-env node, mocha */

var assert = require('chai').assert;
var sinon = require('sinon');
var Bluebird = require('bluebird');

suite('Html build', function() {
  test('successful build with provided file', function(done) {
    var htmlBuild = htmlBuildSpy({});

    htmlBuild.module.build('/build', '/src/index.html').then(function() {
      assert.ok(htmlBuild.readFileSpy.calledOnce);
      assert.ok(htmlBuild.writeFileSpy.calledOnce);

      assert.deepEqual(htmlBuild.readFileSpy.args[0], ['/src/index.html']);
      assert.equal(htmlBuild.writeFileSpy.args[0][0], ['/build/index.html']);

      done();
    });
  });

  test('minified html is output in production', function(done) {
    var htmlBuild = htmlBuildSpy({
      readFile: function(filePath) {
        return Bluebird.resolve('<html>          </html>');
      }
    });

    htmlBuild.module.build('/build', '/src/index.html').then(function() {
      assert.ok(htmlBuild.writeFileSpy.calledOnce);
      assert.deepEqual(htmlBuild.writeFileSpy.args[0], [
        '/build/index.html',
        '<html></html>'
      ]);

      done();
    });
  });

  test('errors due to invalid templates are caught and fail the build', function(done) {
    var htmlBuild = htmlBuildSpy({
      readFile: function(filePath) {
        return Bluebird.resolve('<% throw new Error("System error!") %>');
      }
    });

    htmlBuild.module.build('/build', '/src/index.html').then(null, function(err) {
      assert.ok(true, 'Build promise was rejected');
      assert.equal(err.message, 'Template error: System error!');

      done();
    });
  });
});


function htmlBuildSpy(deps) {
  var htmlBuildDeps = {
    readFile: sinon.spy(deps.readFile || function(filePath) {
      return Bluebird.resolve('Entire file content');
    }),
    writeFile: sinon.spy(deps.writeFile || function(filePath, stream) {
      return Bluebird.resolve();
    })
  };

  return {
    module       : require('../src/build/html-build')(htmlBuildDeps),
    readFileSpy  : htmlBuildDeps.readFile,
    writeFileSpy : htmlBuildDeps.writeFile
  };
}
