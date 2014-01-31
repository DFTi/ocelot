var Ocelot = require("./src/ocelot/ocelot.js"),
ocelot = new Ocelot(),
ui = {};

global.ocelot = ocelot;
global.ui = ui;
global.$ = $;

process.env.PORT = 7777;

var scrollBottom = function(e) {
  var height = e[0].scrollHeight;
  e.scrollTop(height);
};

var renderReceiver = function() {
  $('#content').html(JST['templates/receiver']({
    /* Saved data would go here */
    queue: [],
    settings: {}
  }));

  $('#menu .active').removeClass('active');
  $('#menu #rx-tab').addClass('active');

  ui.rx = {
    log: function(m) { scrollBottom($('.logs .rx pre').append(m+"\n")) },
    host: $('#content input[name=host]'),
    bin: $('#content input[name=bin]')
  };
  ui.rx.host.change(function(e) { ocelot.receive($(e.target).val()); });
  ui.rx.bin.change(function(e) {
    var input = $(e.target).val();
    ui.rx.log("Will try to use directory path "+input);
    ocelot.data.rx.binPath = input;
  });
};

var renderTransmitter = function() {
  $('#content').html(JST['templates/transmitter']({
    /* Saved data would go here */
    receivers: [],
    activity: []
  }));

  $('#menu .active').removeClass('active');
  $('#menu #tx-tab').addClass('active');

  ui.tx = {
    log: function(m) { scrollBottom($('.logs .tx pre').append(m+"\n")) },
    file: $('#content input[name=file]'),
    port: $('#content input[name=port]')
  };
  ui.tx.file.change(function(e) { ocelot.serve($(e.target).val()); });
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
  ui.tx.port.val(process.env.PORT).change(); // start the server
};

$(document).ready(function() {
  /* Setup the UI, render the receiver screen initially 
   * Later, based on persisted settings we decide which view to render */
  renderReceiver();
  $("#menu #rx-tab").click(renderReceiver)
  $("#menu #tx-tab").click(renderTransmitter);
});
