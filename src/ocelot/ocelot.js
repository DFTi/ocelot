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

  this.socket = null;
};

util.inherits(Ocelot, events.EventEmitter);

Ocelot.prototype.buildIndex = function(filepath, callback) {
  indexer.indexFile(filepath, PART_SIZE, callback);
};

  // Receiver 
Ocelot.prototype.setupReceiver = function(url, callback) {
  var self = this;
  if (/localhost|0\.0\.0\.0|127\.0\.0\.1/.test(url)) {
    console.log("No connecting to yourself!");
    callback(false);
  } else {
    receiver.connect(url, ocelot);
  }
};

Ocelot.prototype.setupTransmitter = function(port, callback) {
  var self = this;
  this.teardownTransmitter(function() {
    data.tx.clients = {}
    this.server = http.createServer(app);
    this.server.io = require('socket.io').listen(this.server);
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

module.exports = Ocelot;

