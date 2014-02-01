var io = require('socket.io-client');

module.exports = {

  /* Try to connect to a transmitter.
   * Callback parameters: (err, socket) */
  connect: function(url, callback) {
    // Cleanup old hosts so that the user can retry at will
    for (s in io.sockets) { delete io.sockets[s] }
    var timeout = 2000;
    var socket = io.connect(url, { timeout: timeout });

    socket.on('error', function(err) {
      console.log("general socket error");
      callback(err || new Error("error"));
    });

    socket.on('connect_error', function(err) {
      console.log('connect_error', err);
      callback(err || new Error("connect_error"));
    });

    socket.on('connect_timeout', function() {
      console.log('connect_timeout');
      callback(err || new Error("connect_timeout"));
    });

    socket.on('connect', function () {
      console.log("connected");
      callback(null, socket);
    });

    socket.on('reconnect', function(n) {
      console.log("Reconnected successfully after "+n+" attempts");
      callback(null, socket);
    });

    socket.on('reconnect_error', function(err) {
      console.log("reconnect_error");
      callback(new Error("Reconnect error"));
    });

    socket.on('reconnect_failed', function() {
      console.log("reconnect_failed");
      callback(new Error("Reconnection failed"));
    });

    socket.on('disconnect', function() {
      callback(new Error("Disconnected! Will try reconnecting with exponential backoff."));
      setTimeout(function() {
        socket.socket.reconnect();
      }, 2000);
    });

    // Sometimes no connection is made nor is an error event emitted
    // We will ensure that we call back by doing a final check.
    setTimeout(function(){
      if (!socket.socket.connected) {
        callback(new Error("Connection attempt fatally timed out"));
      }
    }, (timeout*2));
  }
}
