var fs = require('graceful-fs'),
md5sum = require(__dirname+'/md5sum.js');

/* Splits a file into parts and builds an index as such
 * { (int) offset : (string) md5sum , ... } and sent by callback 
 * First argument of the callback is errors (if any)
 * Second argument of the callback is the index itself */
var indexer = {
  indexFile: function(filepath, part_size, callback) {
    fs.stat(filepath, function (err, stats) {
      if (err) {
        return callback(err);
      } else {
        var parts = {};
        var byte_offset = 0;
        var size = stats.size;
        var num_parts = Math.ceil(size / part_size);
        for (var i = 0; i < num_parts; i++) {
          byte_offset = (part_size * i);
          md5sum(filepath, {
            start: byte_offset,
            end: ( byte_offset + part_size )
          }, function(hash, offset) {
            parts[String(offset)] = hash;
            if (Object.keys(parts).length === num_parts) {
              return callback(null, parts);
            }
          });
        }
      }
    });
  }
};

module.exports = indexer;

