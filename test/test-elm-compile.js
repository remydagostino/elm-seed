/*eslint-env node, mocha */

var assert = require('chai').assert;
var sinon = require('sinon');
var Bluebird = require('bluebird');
var readableFrom = require('from');

var MINIFIED_CODE_PLACEHOLDER = 'minified_code';

var elmOptions = {
  dir: '/elm',
  main: 'App.elm',
  bin: { 'elm-make': 'my-local-elm-make' }
};

suite('Elm compile', function() {
  test('success case (dev)', function(done) {
    var elmBuild = elmCompileSpy({});

    elmBuild.module.devBuild('/build', elmOptions).then(function() {
      assert.ok(elmBuild.spawnSpy.calledOnce, 'Only one elm process spawned');
      assert.ok(!elmBuild.jsMinifySpy.called, 'Minifier was not invoked');

      assert.equal(
        elmBuild.spawnSpy.args[0][0],
        elmOptions.bin['elm-make'],
        'Local elm make executable was used'
      );

      assert.deepEqual(
        elmBuild.spawnSpy.args[0][1],
        ['/elm/App.elm', '--yes', '--report=json', '--output', '/build/elm.js'],
        'Elm make called with the correct arguments'
      );

      assert.propertyVal(
        elmBuild.spawnSpy.args[0][2],
        'stdio',
        'pipe',
        'All process output is being piped back into the program'
      );

      done();
    });
  });

  test('success case (production)', function(done) {
    var elmBuild = elmCompileSpy({});

    elmBuild.module.build('/build', elmOptions).then(function() {
      assert.ok(elmBuild.spawnSpy.calledOnce, 'Only one elm process spawned');
      assert.ok(elmBuild.jsMinifySpy.calledOnce, 'Minifier was called only once');
      assert.ok(elmBuild.writeFileSpy.calledOnce, 'Write file was called once');

      assert.deepEqual(
        elmBuild.writeFileSpy.args[0],
        ['/build/elm.js', MINIFIED_CODE_PLACEHOLDER],
        'Minified code was written to elm.js'
      );

      done();
    });
  });

  suite('error cases', function() {
    test('elm-make bad exit code', function(done) {
      var elmBuild = elmCompileSpy({
        spawn: function() {
          return fakeProcess().triggerClose(1).process;
        }
      });

      elmBuild.module.build('/build', elmOptions).then(null, function() {
        assert.ok(true, 'Build promise was rejected');
        assert.ok(!elmBuild.jsMinifySpy.called, 'Minifier was not called');
        done();
      });
    });

    test('copying to build dir fails', function(done) {
      var elmBuild = elmCompileSpy({
        writeFile: function() {
          return new Bluebird.Promise(function() {
            throw new Error('System error!');
          });
        }
      });

      elmBuild.module.build('/build', elmOptions).then(null, function(err) {
        assert.ok(true, 'Build promise was rejected');
        assert.deepEqual(err, { message: 'System error!' });

        done();
      });
    });
  });
});

function elmCompileSpy(deps) {
  var elmCompileDeps = {
    spawn: sinon.spy(deps.spawn || function() {
      return fakeProcess().triggerClose(0).process;
    }),
    env: deps.env || {},
    writeFile: sinon.spy(deps.writeFile || function(filePath, content) {
      return Bluebird.resolve();
    }),
    jsMinify: sinon.spy(deps.jsMinify || function(filePath) {
      return Bluebird.resolve({ code: MINIFIED_CODE_PLACEHOLDER });
    })
  };

  return {
    module       : require('../src/build/elm-compile')(elmCompileDeps),
    spawnSpy     : elmCompileDeps.spawn,
    writeFileSpy : elmCompileDeps.writeFile,
    jsMinifySpy  : elmCompileDeps.jsMinify
  };
}

function fakeProcess(messages) {
  var onCloseHandler = null;
  var proc = {
    stdin: readableFrom([]),
    stdout: readableFrom([]),
    stderr: readableFrom(messages || []),
    on: function(ev, cb) {
      if (ev === 'close') {
        onCloseHandler = cb;
      }
    }
  };

  var processWrapper = {
    process: proc,
    triggerClose: function(exitCode) {
      process.nextTick(function() {
        onCloseHandler(exitCode);
      });

      return processWrapper;
    }
  };

  return processWrapper;
}
