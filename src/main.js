var Ocelot = require("./src/ocelot.js"), ocelot = new Ocelot();
global.ocelot = ocelot;
global.$ = $;

process.env.PORT = 7777;

var scrollBottom = function(e) {
  var height = e[0].scrollHeight;
  e.scrollTop(height);
};

$(document).ready(function() {
  var ui = {
    tx: {
      log: function(m) { scrollBottom($('.logs .tx pre').append(m+"\n")) },
      file: $('.tx input[name=file]'),
      port: $('.tx input[name=port]')
    },
    rx: {
      log: function(m) { scrollBottom($('.logs .rx pre').append(m+"\n")) },
      host: $('.rx input[name=host]'),
      bin: $('.rx input[name=bin]')
    }
  };

  global.ui = ui;


  ui.tx.file.change(function(e) { ocelot.serve($(e.target).val()); });
  ui.rx.host.change(function(e) { ocelot.receive($(e.target).val()); });
  ui.tx.port.change(function(e) {
    var port = parseInt($(e.target).val());
    var listen = function() {
      ocelot.server.listen(port, function() {
        ui.tx.log("Listening on port "+port);
      });
    };
    if (port > 0) {
      var addr = ocelot.server.address();
      if (addr) {
        if (addr.port !== port) {
          ocelot.server.close(listen)
        }
      } else { 
        listen();
      }
    }
  });
  ui.rx.bin.change(function(e) {
    var input = $(e.target).val();
    ui.rx.log("Will try to use directory path "+input);
    ocelot.data.rx.binPath = input;
  });

  ui.tx.port.val(process.env.PORT).change(); // start the server
});
