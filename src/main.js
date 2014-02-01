var Ocelot = require("./src/ocelot/ocelot.js"),
ocelot = new Ocelot(),
ui = {
  rx: {
    render: function() {
      $('#content > #receiver').html(JST['templates/receiver']({
        /* Saved data would go here */
        queue: [],
        settings: {}
      }));

      $('.storage-path .button').click(function() {
        var chooser = $('.storage-path #dirDialog');
        chooser.change(function(e) {
          ui.rx.bin.val($(this).val());
          ocelot.data.rx.binPath = input;
        });
        chooser.trigger('click');  
      });

      var connecting = false;

      $('.remote-host input').change(function(e) {
        if (connecting) { return false; }
        connecting = true;
        var host = "http://"+($(this).val().replace('http://',''));
        $('.remote-host').addClass('loading');
        ocelot.connectToTransmitter(host, function(connected) {
          if (connected) {
            $('.remote-host .icon').removeClass('red').addClass('green');
            $('.remote-host').removeClass('loading');
          } else {
            $('.remote-host .icon').removeClass('green').addClass('red');
            $('.remote-host').removeClass('loading');
          }
          connecting = false;
        });
      });
    }
  },
  tx: {
    render: function() {
      $('#content > #transmitter').html(JST['templates/transmitter']({
        /* Saved data would go here */
        receivers: [],
        activity: []
      }));

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
    }
  }
};

global.ocelot = ocelot;
global.ui = ui;
global.$ = $;

process.env.PORT = process.env.PORT || 7777;

$(document).ready(function() {
  var switchToReceiver = function() {
    $('#menu .active').removeClass('active');
    $('#menu #rx-tab').addClass('active');
    $('#content > #transmitter').addClass('hidden');
    $('#content > #receiver').removeClass('hidden');
  };

  var switchToTransmitter = function() {
    $('#menu .active').removeClass('active');
    $('#menu #tx-tab').addClass('active');
    $('#content > #receiver').addClass('hidden');
    $('#content > #transmitter').removeClass('hidden');
  };

  ui.rx.render();
  $("#menu #rx-tab").click(switchToReceiver);
  $("#menu #tx-tab").click(switchToTransmitter);
  switchToReceiver(); // Show window
  ui.tx.render();
  ui.tx.port.val(process.env.PORT).change(); // start the server
});
