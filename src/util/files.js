var Bluebird = require('bluebird');
var fs = require('fs');
var rimraf = require('rimraf');
var streams = require('./streams');
var ncp = require('ncp');

module.exports = {
  writeFile: Bluebird.promisify(fs.writeFile),
  readFile: Bluebird.promisify(fs.readFile),
  removeDir: Bluebird.promisify(rimraf),
  createDir: Bluebird.promisify(fs.mkdir),

  copyDir: copyDir,
  bufferFile: bufferFile,
  streamToFile: streamToFile
};

function copyDir(source, dest, options) {
  return Bluebird.promisify(ncp.ncp)(
    source,
    dest,
    {
      filter: options.filter,
      clobber: true,
      stopOnErr: true,
      transform: Boolean(options.transform) && function(read, write, file) {
        streams.drain(read)
          .then(function(content) {
            return options.transform(content, file);
          })
          .then(function(transformed) {
            write.end(transformed);
          })
          .catch(function(err) {
            write.emit('error', err);
          });
      }
    }
  );
}

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
