global.$ = $;
var fs = require('graceful-fs');

var Hapi = require('hapi');

// Create a server with a host and port
var server = Hapi.createServer('localhost', 0);

// Add the route
server.route({
    method: 'GET',
    path: '/hello',
    handler: function (request, reply) {

        reply('hello world');
    }
});

$(document).ready(function() {
  var ui = {
    tx: {
      log: function(m) { $('.logs .tx pre').prepend(m+"\n") },
      file: $('.tx input[name=file]')
    },
    rx: {
      log: function(m) { $('.logs .rx pre').prepend(m+"\n") },
      host: $('.rx input[name=host]')
    }
  };

  server.start(function () {
    ui.tx.log('Server started at: ' + server.info.uri);
  });


  ui.tx.file.change(function() {
    var filepath = ui.tx.file.val();
    fs.exists(filepath, function(exists) {
      if (exists) {
        /* Check the size of the file
         * Create a JSON structure of all parts and md5s
         * When this is done, start the server and notify
         */
      }
    });
  });

  ui.rx.host.change(function() {
    ui.rx.log("Checking");
  });
});
