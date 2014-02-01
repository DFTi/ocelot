var Ocelot = require("./src/ocelot/ocelot.js"),
ocelot = new Ocelot(),
ui = {};

global.ocelot = ocelot;
global.ui = ui;
global.$ = $;

process.env.PORT = process.env.PORT || 7777;

var renderReceiver = function() {
  $('#content').html(JST['templates/receiver']({
    /* Saved data would go here */
    queue: [],
    settings: {}
  }));

  $('#menu .active').removeClass('active');
  $('#menu #rx-tab').addClass('active');


  $('.storage-path .button').click(function() {
    var chooser = $('.storage-path #dirDialog');
    chooser.change(function(e) {
      ui.rx.bin.val($(this).val());
      ocelot.data.rx.binPath = input;
    });
    chooser.trigger('click');  
  });

  var connect = function(cb) {
    setTimeout(function() { cb(true) },2000);
  };

  $('.remote-host input').change(function(e) {
    var host = $(this).val();
    $('.remote-host').addClass('loading');
    connect(function(connected) {
      if (connected) {
        $('.remote-host .icon').removeClass('red').addClass('green');
        $('.remote-host').removeClass('loading');
      }
    });
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
    log: function(m) { console.log("TX LOG: "+m); },
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
