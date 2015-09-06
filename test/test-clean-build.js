/*eslint-env node, mocha */

var assert = require('chai').assert;
var sinon = require('sinon');
var Bluebird = require('bluebird');

suite('Clean build', function() {
  test('success case', function(done) {
    var cleanBuild = cleanBuildSpy({});

    cleanBuild.module.clean('./build').then(function() {
      assert.ok(cleanBuild.removeDirSpy.calledOnce);
      assert.ok(cleanBuild.createDirSpy.calledThrice);

      assert.deepEqual(cleanBuild.removeDirSpy.args[0], ['build']);
      assert.deepEqual(cleanBuild.createDirSpy.args[0], ['build']);
      assert.deepEqual(cleanBuild.createDirSpy.args[1], ['build/static']);
      assert.deepEqual(cleanBuild.createDirSpy.args[2], ['build/styles']);

      done();
    });
  });

  test('remove dir fails', function(done) {
    var cleanBuild = cleanBuildSpy({
      removeDir: function() {
        return new Bluebird.Promise(function() {
          throw new Error('System Error!');
        });
      }
    });

    cleanBuild.module.clean('./build').then(null, function(err) {
      assert.ok(cleanBuild.removeDirSpy.calledOnce);
      assert.ok(!cleanBuild.createDirSpy.called);

      assert.equal(err.message, 'System Error!', 'The error was caught');

      done();
    });
  });

  test('create dir fails', function(done) {
    var cleanBuild = cleanBuildSpy({
      createDir: function() {
        return new Bluebird.Promise(function() {
          throw new Error('System Error!');
        });
      }
    });

    cleanBuild.module.clean('./build').then(null, function(err) {
      assert.ok(cleanBuild.removeDirSpy.calledOnce);
      assert.ok(cleanBuild.createDirSpy.calledOnce);

      assert.equal(err.message, 'System Error!', 'The error was caught');

      done();
    });
  });
});


function cleanBuildSpy(deps) {
  var cleanBuildDeps = {
    removeDir: sinon.spy(deps.removeDir || function(filePath) {
      return Bluebird.resolve();
    }),
    createDir: sinon.spy(deps.createDir || function(filePath) {
      return Bluebird.resolve();
    })
  };

  return {
    module       : require('../src/build/clean')(cleanBuildDeps),
    removeDirSpy : cleanBuildDeps.removeDir,
    createDirSpy : cleanBuildDeps.createDir
  };
}
