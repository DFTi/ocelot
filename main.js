global.$ = $;

var fs = require('fs');

var net = require('net');

var Status = function(el) {
  this.el = el;
  this.log = function(message) {
    el.prepend("<li>"+message+"</li>");
  };
}

$(document).ready(function() {
  var send = {
    status: new Status($('#send .status')),
    path: $('#send #file')
  },
  receive = {
    status: $('#receive .status'),
    host: $('#receive #host')
  };

  var server = net.createServer(function(c) { //'connection' listener
    console.log('server connected');
    c.on('end', function() {
      console.log('server disconnected');
    });
    c.write('hello\r\n');
    c.pipe(c);
  });

  server.listen(8124, function() { //'listening' listener
    status.prepend("test");
  });

  fileinput.change(function() {
    var filepath = fileinput.val();
    fs.exists(filepath, function(exists) {
      if (exists) {
        /* Check the size of the file
         * Create a JSON structure of all parts and md5s
         * When this is done, start the server and notify
         */
        send.status.update("start");
      }
    });
  });
});
