var Ocelot = require("./lib/ocelot.js"), ocelot = new Ocelot();
global.ocelot = ocelot;
global.$ = $;

// Add the route

$(document).ready(function() {
  var ui = {
    tx: {
      log: function(m) { $('.logs .tx pre').append(m+"\n") },
      file: $('.tx input[name=file]')
    },
    rx: {
      log: function(m) { $('.logs .rx pre').append(m+"\n") },
      host: $('.rx input[name=host]')
    }
  };

  global.ui = ui;

  ocelot.server.start(function () {
    ui.tx.log('Serving from ' + ocelot.server.info.uri);
  });

  ui.tx.file.change(function(e) { ocelot.serve($(e.target).val()); });
  ui.rx.host.change(function(e) { ocelot.receive($(e.target).val()); });
});
