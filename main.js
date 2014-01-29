global.$ = $;

var fs = require('fs');

var net = require('net');


$(document).ready(function() {
  var status = $('#status'),
  fileinput = $('#send #file');

  status.text('starting up');
  
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
        alert(filepath);
      }
    });  
  });
});
