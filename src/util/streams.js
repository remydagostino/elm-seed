var through = require('through');
var Bluebird = require('bluebird');

module.exports = {
  bufferedThrough: bufferedThrough,
  drain: drain
};

/**
 * In cases where memory & backpressure are not an issue, it's simpler and more
 * sensible to drain the whole stream and create a promise.
 * @param  {Stream} stream The stream to be drained
 * @return {Promise}       Resolves with the whole content of the stream
 */
function drain(stream) {
  return new Bluebird.Promise(function(resolve, reject) {
    var content = '';

    stream
      .on('error', reject)
      .pipe(through(
        function(data) { content += data; },
        function() { resolve(content); }
      ));
  });
}

/**
 * Creates a tranformer stream that drains the whole input and applies
 * a transformation
 * @param  {Function} transform A function which accepts a string and produces
 *                              a promise of a string
 * @return {Stream}             The transform stream
 */
function bufferedThrough(transform) {
  var content = '';

  return through(
    function(data) {
      content += data;
    },
    function() {
      var self = this;

      transform(content)
      .then(
        function(result) {
          self.queue(result);
          self.queue(null);
        },
        function(ex) {
          self.emit('error', ex);
          self.queue(null);
        }
      );
    }
  );
}
