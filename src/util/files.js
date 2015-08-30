var Bluebird = require('bluebird');
var fs = require('fs');
var rimraf = require('rimraf');
var streams = require('./streams');

module.exports = {
  writeFile: Bluebird.promisify(fs.writeFile),
  readFile: Bluebird.promisify(fs.readFile),
  removeDir: Bluebird.promisify(rimraf),
  createDir: Bluebird.promisify(fs.mkdir),

  bufferFile: bufferFile,
  streamToFile: streamToFile
};

function bufferFile(filePath) {
  return fs.createReadStream(filePath)
    .pipe(streams.bufferedThrough(function(content) {
      return Bluebird.resolve(content);
    }));
}

function streamToFile(filePath, stream) {
  return new Bluebird.Promise(function(resolve, reject) {
    stream.pipe(fs.createWriteStream(filePath))
    .on('close', function() {
      resolve();
    })
    .on('error', function(err) {
      reject(err);
    });
  });
}
