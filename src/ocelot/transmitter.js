var transmitter = {
  /* Start Express and Socket.IO on the specified port.
   * If the server is already running it is closed and
   * restarted using the new port.
   *
   * Callback returns error-first: ((object)error, (object)addrinfo)) */
  listen: function(server, portStr, callback) {
    var port = parseInt(portStr);
    var startServer = function () {
      server.on('error', function (e) {
        callback(e, null);
      });
      server.listen(port, function() {
        callback(null, server.address());
      });
    };
    var addr = server.address(); // Restart the server if it's on.
    if (addr) { if (addr.port !== port) { server.close(startServer); } }
    // Server is not on, so let's start it
    else { startServer(); }
  }
};

module.exports = transmitter;
