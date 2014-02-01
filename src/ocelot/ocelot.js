var fs = require('graceful-fs'),
request = require('request'),
filed = require('filed'),
temp = require('temp'),
express = require('express'),
path = require('path'),
http = require('http'),
os = require('os'),
util = require('util'),
events = require('events'),
app = express();


/* Ocelot Sources */
md5sum = require(__dirname+'/md5sum.js'),
indexer = require(__dirname+'/indexer.js'),
receiver = require(__dirname+'/receiver.js'),
transmitter = require(__dirname+'/transmitter.js');


var data = {
  rx: {},
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

  /* We'll probably just push this once over websocket 
   * and the receiver can be in charge of keeping it together
   * with the download queue item */
  app.get('/index.json', function(req, res) {
    res.json(data.index);
  });

  app.get('/offset/:offset', function(req, res) {
    var offset = req.params.offset;
    var hash = data.index[offset];
    if (hash) {
      var start = parseInt(offset);
      var end = start+PART_SIZE;
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
};

util.inherits(Ocelot, events.EventEmitter);

Ocelot.prototype.buildIndex = function(filepath, callback) {
  indexer.indexFile(filepath, PART_SIZE, callback);
};

  // Receiver 
Ocelot.prototype.setupReceiver = function(url, callback) {
  if (/localhost|0\.0\.0\.0|127\.0\.0\.1/.test(url)) {
    console.log("No connecting to yourself!");
    callback(false);
  } else {
    this.teardownReceiver(function() {
      console.log('Attempting connection to '+url);
      receiver.connect(url, function(success, socket) {
        if (success) {
          socket.emit('receiver:ready', {
            name: os.hostname()
          });

          socket.on('incoming:transmission', function (data) {
            console.log(data)
          }); 
          data.rx.socket = socket;
          callback(socket);
        } else {
          callback(false);
        }
      });
    });
  }
};


Ocelot.prototype.teardownReceiver = function(callback) {
  if (data.rx.socket && data.rx.socket.socket) {
    data.rx.socket.socket.disconnectSync();
    data.rx.socket = null;
    callback();
  } else
    callback();
};

  // Transmitter
Ocelot.prototype.setupTransmitter = function(port, callback) {
  this.teardownTransmitter(function() {
    data.tx.clients = {}
    this.server = http.createServer(app);
    this.server.io = require('socket.io').listen(this.server);
    this.server.io.sockets.on('connection', function (socket) {
      data.tx.clients[socket.id] = socket;

      socket.on('disconnect', function() {
        delete data.tx.clients[socket.id];
        console.log("destroyed receiver socket "+socket.id);
      });

      socket.on('receiver:ready', function (data) {
        socket.data = { name: data.name };
      });
    });
    transmitter.listen(this.server, port, callback);
  }.bind(this));
};

Ocelot.prototype.teardownTransmitter = function(callback) {
  if (this.server && this.server.address()) {
    this.server.close(function() {
      this.server = null;
      callback()
    }.bind(this));
  } else { callback() }
};

module.exports = Ocelot;
