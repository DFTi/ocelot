var fs = require('graceful-fs'),
request = require('request'),
filed = require('filed'),
temp = require('temp'),
express = require('express'),
path = require('path'),
http = require('http'),
util = require('util'),
events = require('events'),
app = express();


/* Ocelot Sources */
md5sum = require(__dirname+'/md5sum.js'),
indexer = require(__dirname+'/indexer.js'),
receiver = require(__dirname+'/receiver.js'),
transmitter = require(__dirname+'/transmitter.js');

var data = {
  rx: {
    binPath: '/Users/keyvan/Desktop/ocelotbin',
    baseURL: null,
    transfers: {}
  },
  tx: {}
},
DONT_GOT = 0,
GETTING = 1,
GOT = 2,
VERIFYING = 3,
VERIFIED = 4,
PART_SIZE = 2816000;

function Ocelot() {
  "use strict";

  this.data = data;

  app.get('/:id/:offset', function(req, res) {
    var id = req.params.id,
    offset = req.params.offset,
    filepath = data.tx[id];
    if ( id && offset && filepath ) {
      var start = parseInt(offset);
      var end = start+PART_SIZE;
      res.writeHead(206, {
        'Content-Type': "application/octet-stream"
      });
      console.log("delivering chunk!");
      fs.createReadStream(filepath, {
        start: start,
        end: end
      }).pipe(res);
    } else {
      res.send(404);
    }
  });

  this.socket = null;
};

util.inherits(Ocelot, events.EventEmitter);

/*
 * Receiver
 */

Ocelot.prototype.receiverConnected = function() {
  return (this.socket && this.socket.socket && this.socket.socket.connected);
};

Ocelot.prototype.setupReceiver = function(url, callback) {
  receiver.connect(url, this, callback);
};

Ocelot.prototype.teardownReceiver = function () {
  if (this.socket) {
    console.log("cleaning up old socket");
    this.socket.disconnect();
    this.socket.removeAllListeners();
    this.socket.on('connect', function() {
      this.socket.disconnect();
    });
    this.socket = null; // get GC'd eventually
  }
};

Ocelot.prototype.startDownload = function(dl, done, progress) {
  var self = this;
  var offsets = Object.keys(dl.index);
  offsets.forEach(function(offset) {
    // Initialize offset metadata
    if (!data.rx.transfers[dl.id][offset]) {
      data.rx.transfers[dl.id][offset] = {
        status: DONT_GOT,
        // TODO use a private app dir instead of temp
        path: temp.path({prefix: dl.id+offset, suffix: '.part'})
      };
    }
    // Check status of this offset, act accordingly
    var status = dlData.status;
    switch (status) {
      case DONT_GOT: {
        data.rx.transfers[dl.id][offset] = GETTING;
        var downloadURL = dl.baseURL+"/"+dl.id+"/"+offset;
        var downloadPath = data.rx.transfers[dl.id][offset].path;
        var downloadFile = filed(downloadPath);
        var r = request(downloadURL).pipe(downloadFile);
        r.on('data', function(data) {
          console.log("offset "+offset+"data", data);
          // TODO progress bar and throughput
        });
        downloadFile.on('end', function () {
          data.rx.transfers[dl.id][offset] = GOT;
        });
        downloadFile.on('error', function (err) {
          data.rx.transfers[dl.id][offset] = DONT_GOT;
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
          var dir = data.rx.binPath;
          if ( fs.existsSync(dir) && fs.statSync(dir).isDirectory() ) {
            if (data.rx.poll) { clearInterval(data.rx.poll); };
            console.log("All parts verified.");

            var finalPath = path.join(dir, "ocelot.bin");

            if ( fs.existsSync(finalPath) ) {
              fs.unlinkSync(finalPath);
            }

            Object.keys(index).forEach(function(offset, i) {
              var part = data.rx.index[offset];
              console.log("Appending piece "+part.path);
              fs.appendFileSync(finalPath, fs.readFileSync(part.path));
              if (length === i+1) {
                console.log("Done. "+finalPath);
              }
            });
          } else {
            console.log("Enter a valid directory path to continue");
          }
        }
      }
    }
  });
};

/*
 * Transmitter
 */

Ocelot.prototype.setupTransmitter = function(port, callback) {
  var self = this;
  this.teardownTransmitter(function() {
    data.tx.clients = {}
    this.server = http.createServer(app);
    this.server.io = require('socket.io').listen(this.server);
    this.server.io.set('log level', 1);
    this.server.io.sockets.on('connection', function (socket) {
      data.tx.clients[socket.id] = socket;

      socket.on('disconnect', function() {
        self.emit('ui:tx:del_receiver', { id: socket.id });
        delete data.tx.clients[socket.id];
      });

      socket.on('receiver:ready', function (payload) {
        socket.data = { name: payload.name };
        self.emit('ui:tx:add_receiver', {
          id: socket.id,
          name: payload.name
        });
      });
    });
    transmitter.listen(this.server, port, callback);
  }.bind(this));
};

Ocelot.prototype.teardownTransmitter = function(callback) {
  var self = this;
  if (this.server && this.server.address()) {
    for (c in data.tx.clients) {
      data.tx.clients[c].disconnect().removeAllListeners();
      delete data.tx.clients[c];
    }
    this.server.close(function() {
      this.server = null;
      callback()
    }.bind(this));
  } else { callback() }
};

Ocelot.prototype.queueTransmission = function(filepath, recipients, done, indexProgress) {
  var count = 0;
  var sockets = recipients.map(function(id) { return data.tx.clients[id] });
  console.log("Indexing...");
  this.buildIndex(filepath, function(err, index, size) {
    var filename = path.basename(filepath);
    if (err) {
      console.log("We had a fatal error while trying to index the file");
    } else {
      console.log("Indexing is done -- sending the transmission packets");
      sockets.forEach(function(socket) {
        count++;
        var id = md5sum.string(filepath);
        data.tx[id] = filepath; // So that parts can be fetched
        socket.emit('new:incoming:transmission', {
          filename: filename,
          id: id,
          size: size,
          index: index
        });
      });
    }
    done(count, filename);
  }, indexProgress);
};

Ocelot.prototype.buildIndex = function(filepath, callback, progress) {
  indexer.indexFile(filepath, PART_SIZE, callback, progress);
};

module.exports = Ocelot;

