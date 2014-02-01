module.exports = {
  connect: function(url, callback) {
    var timeout = 5000;
    var io = require('socket.io-client');
    var socket = io.connect(url, { timeout: timeout });
    socket.on('connect', function () {
      socket.on('news', function (data) {
        console.log(data);
        socket.emit('my other event', { my: 'data' });
      }); 
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
    setTimeout(function(){callback(socket.socket.connected)}, (timeout*2));
  }
}
