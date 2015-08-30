var through = require('through');

module.exports = {
  bufferedThrough: bufferedThrough
};

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
