module.exports = function(ocelot) {
  var ui = {
    /* Receiver User Interface Functions */
    rx: {
      render: function(html) {
        $('#content > #receiver').html(html);

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
          ocelot.connectToTransmitter(host, function(success) {
            if (success) {
              $('.remote-host .icon').removeClass('red').addClass('green');
              $('.remote-host').removeClass('loading');
            } else {
              $('.remote-host .icon').removeClass('green').addClass('red');
              $('.remote-host').removeClass('loading');
            }
            connecting = false;
          });
        });
      },

      show: function() {
        $('#menu .active').removeClass('active');
        $('#menu #rx-tab').addClass('active');
        $('#content > #transmitter').addClass('hidden');
        $('#content > #receiver').removeClass('hidden');
      }
    },

    /* Transmitter User Interface Functions */
    tx: {
      render: function(html) {
        var $el = $('#content > #transmitter').html(html);
        var lastUsedPort = (ocelot.data.tx.port || process.env.PORT);
        var portInput = $el.find('.listen-port input').val(lastUsedPort);
        var changePortButton = $el.find('.listen-port .button');
        var serverToggleSwitch = {
          ui: $el.find('.toggle-server.ui.checkbox'),
          label: $el.find('.toggle-server label')
        };

        var setupTransmitter = function() {
          var port = ocelot.data.tx.port;
          ocelot.setupTransmitter(ocelot.data.tx.port, function(err, addr) {
            if (addr) {
              ocelot.data.tx.port = addr.port;
              serverToggleSwitch.label.text('Transmitter is listening on port '+addr.port);
              serverToggleSwitch.ui.checkbox('enable');
              portInput.val(addr.port);
            } else {
              serverToggleSwitch.label.text('Transmitter is OFF');
              serverToggleSwitch.ui.checkbox('disable');
            }
          });
        };

        serverToggleSwitch.ui.checkbox({
          onEnable: setupTransmitter,
          onDisable: function() {
            ocelot.teardownTransmitter(function() {
              serverToggleSwitch.label.text('Transmitter is OFF');
            });
          },
          performance:false, debug:false, verbose:false
        });

        changePortButton.click(function(e) {
          var port = parseInt(portInput.val());
          ocelot.data.tx.port = port;
          setupTransmitter();
        });
      },

      show: function() {
        $('#menu .active').removeClass('active');
        $('#menu #tx-tab').addClass('active');
        $('#content > #receiver').addClass('hidden');
        $('#content > #transmitter').removeClass('hidden');
      }
    }
  };
  return ui;
};

