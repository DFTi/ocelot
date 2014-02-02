var io = require('socket.io-client'),
os = require('os');

module.exports = {

  /* Try to connect to a transmitter.
   * Callback parameters: (err, socket) */
  connect: function(url, ocelot, callback) {
    // Cleanup old hosts so that the user can retry at will
    for (s in io.sockets) { delete io.sockets[s] }
    // Remove any existing socket
    ocelot.teardownReceiver();
    var timeout = 1500;
    var socket = io.connect(url, { timeout: timeout });
    ocelot.socket = socket;
    socket.on('connect', function () {
      ocelot.emit('ui:rx:connected');
      console.log("socket connected successfully");

      socket.emit('receiver:ready', {
        name: os.hostname()
      });

      socket.on('incoming:transmission', function (data) {
        console.log("incoming transmission!");
        console.log(data);
      }); 

      callback();
    });// - "connect" is emitted when the socket connected successfully
    socket.on('connecting', function () {
      console.log('socket is attempting to connect with the server.');
    });// - "connecting" is emitted when the socket is attempting to connect with the server.
    socket.on('disconnect', function () {
      ocelot.emit('ui:rx:disconnected');
      console.log("socket disconnected");
    });// - "disconnect" is emitted when the socket disconnected
    socket.on('connect_failed', function () {
      ocelot.emit('ui:rx:disconnected');
      console.log('connected failed, no fallback transports');
      callback();
    });// - "connect_failed" is emitted when socket.io fails to establish a connection to the server and has no more transports to fallback to.
    socket.on('error', function () {
      ocelot.emit('ui:rx:disconnected');
      console.log("socket error");
      callback();
    });// - "error" is emitted when an error occurs and it cannot be handled by the other event types.
    socket.on('message', function (message, callback) {
      console.log("socket message received", message);
    });// - "message" is emitted when a message sent with socket.send is received. message is the sent message, and callback is an optional acknowledgement function.
    socket.on('anything', function(data, callback) {
    });// - "anything" can be any event except for the reserved ones. data is data, and callback can be used to send a reply.
    socket.on('reconnect_failed', function () {
      ocelot.emit('ui:rx:disconnected');
      console.log("reconnect failed");
    });// - "reconnect_failed" is emitted when socket.io fails to re-establish a working connection after the connection was dropped.
    socket.on('reconnect', function () {
      ocelot.emit('ui:rx:connected');
      console.log("successful reconnection");
    });// - "reconnect" is emitted when socket.io successfully reconnected to the server.
    socket.on('reconnecting', function () {
      console.log("attempting reconnect");
    });// - "reconnecting" is emitted when the socket is attempting to reconnect with the server.
  }
}
