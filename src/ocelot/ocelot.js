var fs = require('graceful-fs'),
express = require('express'),
path = require('path'),
http = require('http'),
util = require('util'),
events = require('events'),
app = express();


/* Ocelot Sources */
md5sum = require(__dirname+'/md5sum.js').string,
indexer = require(__dirname+'/indexer.js'),
receiver = require(__dirname+'/receiver.js'),
transmitter = require(__dirname+'/transmitter.js'),
Download = require(__dirname+'/download.js');

var data = {
  rx: {
    binPath: '',
    transfers: {}
  },
  tx: {}
},
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

/*
ocelot.startDownload({id: '89cc098911d7866859b539f7cfff3683'}, $('tr.download').data('onDone'), $('tr.download').data('onProgress'))
*/
Ocelot.prototype.startDownload = function(payload, done, progress) {
  console.log("starting download");
  var download = new Download(data.rx.transfers, payload, data.rx.binPath);
  var working = false;
  progress(0);
  console.log("sent progress 0, checking out offsets to see what is needed");
  download.eachOffset(function(offset, meta, i) {
    if (meta.status !== VERIFIED) {
      working = true;
      download.needs(offset, meta, done, progress);
    } else {
      progress(download.progress);
    }
  }.bind(this));

  if (!working) {
    download.concat(done, progress);
  }
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
        var id = md5sum(filepath);
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

