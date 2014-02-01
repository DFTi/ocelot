module.exports = {
  connect: function(url, callback) {
    var timeout = 5000;
    var io = require('socket.io-client');
    // Cleanup old hosts so we user can try again
    for (s in io.sockets) { delete io.sockets[s] }
    var socket = io.connect(url, { timeout: timeout });
    socket.on('connect', function () {
      callback(true, socket);
    });
    socket.on('error', function(err) {
      console.log(err);
      callback(false);
    });
    socket.on('connect_error', function(err) {
      console.log('connect_error', err);
      callback(false);
    });
    socket.on('connect_timeout', function() {
      console.log('connect_timeout');
      callback(false);
    });
    // Sometimes no connection is made nor is an error event emitted
    // We will ensure that we call back by doing a final check.
    setTimeout(function(){
      if (!socket.socket.connected) {
        callback(false);
      }
    }, (timeout*2));
  }
}
