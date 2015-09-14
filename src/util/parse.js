var _ = require('lodash');

module.exports = {
  multipleArrays: parseMultipleArrays
};

function parseMultipleArrays(str) {
  var brackets = 0;
  var chunks = [];
  var buffer = '';

  str.split('').forEach(function(char) {
    if (char === '[') {
      brackets += 1;
    }

    if (brackets > 0) {
      if (char === ']') {
        brackets -= 1;
      }

      buffer += char;

      if (brackets === 0) {
        chunks.push(buffer);
        buffer = '';
      }
    }
  });

  return _.flatten(chunks.map(function(chunk) {
    return JSON.parse(chunk);
  }));
}
