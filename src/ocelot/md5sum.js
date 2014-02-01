var fs = require('graceful-fs'),
crypto = require('crypto');

var md5sum = function(path, options, callback) {
  // the file you want to get the hash
  var fd = fs.createReadStream(path, options);
  var hash = crypto.createHash('md5');
  hash.setEncoding('hex');

  fd.on('end', function() {
    hash.end();
    var digest = hash.read();
    if (digest.length > 0) {
      callback(digest, options.start);
    }
  });
  // read all file and pipe it (write it) to the hash object
  fd.pipe(hash);
};

module.exports = md5sum;
