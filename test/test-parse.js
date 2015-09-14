/*eslint-env node, mocha */

var assert = require('chai').assert;
var parse = require('../src/util/parse');

suite('Parse', function() {
  test('Single array', function() {
    assert.deepEqual(
      parse.multipleArrays('[1, 2, 3, 4, 5]'),
      [1, 2, 3, 4, 5]
    );
  });

  test('Multiple arrays', function() {
    assert.deepEqual(
      parse.multipleArrays('[1, 2][3, 4, 5][6, 7, 8]'),
      [1, 2, 3, 4, 5, 6, 7, 8]
    );
  });

  test('Space between arrays is ignored', function() {
    assert.deepEqual(
      parse.multipleArrays('asdads[1, 2]\n\n[3, 4, 5]aaa[6]'),
      [1, 2, 3, 4, 5, 6]
    );
  });
});
