var transmitter = {
  /* Start the server on a specified port. If the server is already
   * running it is closed and restarted on the new port.
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
