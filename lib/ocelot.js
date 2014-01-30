var fs = require('graceful-fs'),
Hapi = require('hapi');

var crypto = require('crypto');


function Ocelot() {
  "use strict";

  this.part_size = 2816000;

  // Used to store ranges and hashes
  this.index = {};

  // API server used in transmission
  this.server = Hapi.createServer('localhost', 0);
  this.server.route({
    method: 'GET',
    path: '/index.json',
    handler: function (request, reply) {
      reply(this.index);
    }.bind(this)
  });

};


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
}

Ocelot.prototype.buildIndex = function(filepath, callback) {
  fs.stat(filepath, function (err, stats) {
    if (err) {
      return callback(err);
    } else {
      var parts = {};
      var byte_offset = 0;
      var size = stats.size;
      var num_parts = Math.ceil(size / this.part_size);
      console.log(num_parts);
      for (var i = 0; i < num_parts; i++) {
	byte_offset = (this.part_size * i);
        md5sum(filepath, {
          start: byte_offset,
          /* 'end' here may be past the EOF, hopefully this is OK
           *  and handled by createReadStream -- if not we must handle */
          end: (byte_offset + this.part_size )
        }, function(hash, offset) {
          parts[String(offset)] = hash;
          // I dont want to return the below callback until after
          // all of these hash computations have completed
	  if (Object.keys(parts).length === num_parts) {
		  return callback(null, parts);
	  }
        });
      }
    }
  }.bind(this));
};

Ocelot.prototype.serve = function(filepath) {
  fs.exists(filepath, function(exists) {
    if (exists) {
      ui.tx.log("Indexing, please wait ...");
      ocelot.buildIndex({
        filepath: filepath,
        total_size: stats.size,
        done: function(err, index){
          if (err) {
            ui.tx.log("Error: "+err.message);
          } else {
            ocelot.index = index
            ui.tx.log("Indexed "+filepath);
          }
        }
      });
    }
  });
};

module.exports = Ocelot;
