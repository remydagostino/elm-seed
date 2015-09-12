/*eslint-env node, mocha */

var assert = require('chai').assert;
var highlight = require('../src/util/highlight');

suite('Highlight', function() {
  test('Single line highlight', function() {
    assert.deepEqual(
      highlight.lines(
        [ 'good good bad good' ],
        {
          start: { line: 1, column: 11 },
          end:   { line: 1, column: 14 }
        },
        {
          start: { line: 1, column: 12 },
          end:   { line: 1, column: 13 }
        }
      ),
      [
        {
          lineNum: 1,
          text:   'good good bad good',
          markup: 'good good <strong>b<em>a</em>d</strong> good'
        }
      ]
    );
  });

  test('Multi line highlight', function() {
    assert.deepEqual(
      highlight.lines(
        [
          'good good bad bad',
          'bad terrible terribe terrible',
          'terrible bad good good good'
        ],
        {
          start: { line: 1, column: 11 },
          end:   { line: 3, column: 13 }
        },
        {
          start: { line: 2, column: 5 },
          end:   { line: 3, column: 9 }
        }
      ),
      [
        {
          lineNum: 1,
          text:   'good good bad bad',
          markup: 'good good <strong>bad bad</strong>'
        },
        {
          lineNum: 2,
          text:   'bad terrible terribe terrible',
          markup: '<strong>bad <em>terrible terribe terrible</em></strong>'
        },
        {
          lineNum: 3,
          text:   'terrible bad good good good',
          markup: '<strong><em>terrible</em> bad</strong> good good good'
        }
      ]
    );
  });

  test('Real example', function() {
    assert.deepEqual(
      highlight.lines(
        [
          'module App where',
          '',
          'import Graphics.Element exposing (..)',
          '',
          'main : Element',
          'main =',
          '  show "Hello, Goat!" 25'
        ],
        {
          start: { line: 7, column: 3 },
          end:   { line: 7, column: 25 }
        },
        {
          start: { line: 7, column: 23 },
          end:   { line: 7, column: 25 }
        }
      ),
      [
        {
          lineNum: 7,
          text:   '  show "Hello, Goat!" 25',
          markup: '  <strong>show "Hello, Goat!" <em>25</em></strong>'
        }
      ]
    );
  });
});
