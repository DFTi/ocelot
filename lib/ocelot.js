var fs = require('graceful-fs'),
request = require('request'),
filed = require('filed'),
temp = require('temp'),
md5sum = require(__dirname+'/md5sum.js'),
express = require('express'),
app = express();

// Used to store ranges and hashes
var data = {
  part_size: 2816000,
  filename: null,
  index: null,
  rx: {
    base: null,
    index: {}
  }
},
DONT_GOT = 0,
GETTING = 1,
GOT = 2,
VERIFYING = 3,
VERIFIED = 4;

function Ocelot() {
  "use strict";

  this.data = data;

  this.part_size = data.part_size;

  // API server used in transmission
  app.get('/index.json', function(req, res) {
    res.json(data.index);
  });

  app.get('/offset/:offset', function(req, res) {
    var offset = req.params.offset;
    var hash = data.index[offset];
    if (hash) {
      ui.tx.log("Serving offset "+offset);
      var start = parseInt(offset);
      var end = start+data.part_size;
      res.writeHead(206, {
        'Content-Type': "application/octet-stream"
      });
      fs.createReadStream(data.filepath, {
        start: start,
        end: end
      }).pipe(res);
    } else {
      res.send(404);
    }
  });

  var allowCrossDomain = function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Auth-Token");
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    next();
  };

  app.use(express.bodyParser());

  app.configure(function () {
    app.use(express.methodOverride());
    app.use(allowCrossDomain);
  });

  this.server = require('http').createServer(app);
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
  },

  /* Poll this host for index.json -- if we get one, save it and work on it
   * until we get all the parts so we can concat and get the final file */
  receive: function(host) {
    if (data.rx.poll) { clearInterval(data.rx.poll); };
    var interval = 5000;
    data.rx.base = "http://"+host;
    ui.rx.log("Target set to "+data.rx.base);

    data.rx.poll = setInterval(function() {
      $.getJSON(data.rx.base+"/index.json", this.downloadUsingIndex);
    }.bind(this), interval);
    $.getJSON(data.rx.base+"/index.json", this.downloadUsingIndex);
  },

  downloadUsingIndex: function(index) {
    var base = data.rx.base;
    var length = Object.keys(index).length;
    var verifiedParts = 0;
    Object.keys(index).forEach(function(offset, i) {
      // Check info about this offset, initialize if no info
      if (!data.rx.index[offset]) {
        data.rx.index[offset] = {
          status: DONT_GOT,
          path: temp.path({prefix: offset, suffix: '.part'})
        };
      }
      var label = "part "+(i+1)+" of "+length;
      // Check status of the offset, act accordingly
      var status = data.rx.index[offset].status;
      ui.rx.log(offset+" : "+status);
      switch (status) {
        case DONT_GOT: {
          ui.rx.log("Getting "+label);
          data.rx.index[offset].status = GETTING;
          var downloadURL = base+"/offset/"+offset;
          var downloadPath = data.rx.index[offset].path;
          var downloadFile = filed(downloadPath);
          var r = request(downloadURL).pipe(downloadFile);
          /*r.on('data', function(data) {
            console.log("offset "+offset+"data", data);
          // good place for progress bar
          }); */
          downloadFile.on('end', function () {
            data.rx.index[offset].status = GOT;
          });

          downloadFile.on('error', function (err) {
            ui.rx.log(label+" failed in transit, will retransmit.");
            data.rx.index[offset].status = DONT_GOT; 
          });
          break;
        }
        case GETTING: {
          // TODO check to make sure it's still transferring
          // for now, just trust that we're getting it...
          break;
        }
        case GOT: {
          data.rx.index[offset].status = VERIFYING;
          md5sum(data.rx.index[offset].path, {}, function(hash) {
            if (hash === index[offset]) {
              data.rx.index[offset].status = VERIFIED;
            } else {
              data.rx.index[offset].status = DONT_GOT;
            }
          });
          break;
        }
        case VERIFIED: {
          // Need to find out if all parts are verified
          // if so then we are done and can move onto the 
          // concat phase and rebuild the payload
          ++verifiedParts;
        }
        default: {
          if (verifiedParts === length) {
            if (data.rx.poll) { clearInterval(data.rx.poll); };
            ui.rx.log("All parts verified. Reassembling");
          }
        }
      }
    });
  }
}

module.exports = Ocelot;
