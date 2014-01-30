var fs = require('graceful-fs'),
md5sum = require(__dirname+'/md5sum.js'),
Hapi = require('hapi');

// Used to store ranges and hashes
var data = {
  filename: null,
  index: null
}

function Ocelot() {
  "use strict";

  this.part_size = 2816000;

  // API server used in transmission
  this.server = Hapi.createServer('0.0.0.0', 7777);
  this.server.route({
    method: 'GET',
    path: '/index.json',
    handler: function (request, reply) {
      reply(data.index);
    }
  });

  this.server.route({
    method: 'GET',
    path: '/part/{offset}',
    handler: function (request, reply) {
      var offset = request.params.offset;
      ui.tx.log("Sending offset "+offset);
      ui.tx.log("File: "+data.filepath);
      fs.createReadStream(data.filepath, {
        start: parseInt(offset),
        end: end
      }).pipe(request.raw.res);
    }
  });

};

Ocelot.prototype = {
  buildIndex: function(filepath, callback) {
    fs.stat(filepath, function (err, stats) {
      if (err) {
        return callback(err);
      } else {
        var parts = {};
        var byte_offset = 0;
        var size = stats.size;
        var num_parts = Math.ceil(size / this.part_size);
        for (var i = 0; i < num_parts; i++) {
          byte_offset = (this.part_size * i);
          md5sum(filepath, {
            start: byte_offset,
            /* 'end' here may be past the EOF, hopefully this is OK
             *  and handled by createReadStream -- if not we must handle */
            end: ( byte_offset + this.part_size )
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
  },

  serve: function(filepath) {
    fs.exists(filepath, function(exists) {
      if (exists) {
        data.filepath = filepath;
        ui.tx.log("Indexing, please wait ...");
        setTimeout(function() {
          ocelot.buildIndex(filepath, function(err, index){
            if (err) {
              ui.tx.log("Error: "+err.message);
            } else {
              data.index = index;
              var num_parts = Object.keys(index).length;
              ui.tx.log("Indexed "+num_parts+" parts. Ready!");
            }
          });
        }, 200);
      }
    });
  }
}

module.exports = Ocelot;
