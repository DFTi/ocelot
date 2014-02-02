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
        var lastUsedHost = null;

        var hostInput = $('.remote-host input');
        hostInput.keypress(function (e) {
          if (e.which == 13) {
            var host = "http://"+($(this).val().replace('http://', ''));
            if (ocelot.receiverConnected()) {
              console.log("User is still connected disconnect");
              if (host === lastUsedHost) {
                console.log("User chose to disconnect");
                ocelot.teardownReceiver();
                lastUsedHost = null;
                return false;
              } else {
                console.log("User will try to change hosts");
              }
            }
            $('.remote-host').addClass('loading');
            if (/localhost|0\.0\.0\.0|127\.0\.0\.1/.test(host)) {
              alert("No loopback connections allowed!");
              return false;
            } else if (connecting) {
              console.log("Connecting already...");
              return false;
            }
            lastUsedHost = host;
            connecting = true;
            ocelot.setupReceiver(host, function() {
              connecting = false;
            });
          }
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
          var port = parseInt(portInput.val());
          ocelot.setupTransmitter(port, function(err, addr) {
            if (addr) {
              serverToggleSwitch.ui.find('input').prop('checked', 'true');
              serverToggleSwitch.label.text('Transmitter is listening on port '+addr.port);
              ocelot.data.tx.port = addr.port;
              portInput.val(addr.port);
            } else if (err) {
              serverToggleSwitch.ui.find('input').prop('checked', '');
              serverToggleSwitch.label.text('Transmitter could not start. Error: '+err.code);
            }
          });
        };

        serverToggleSwitch.ui.checkbox({
          onEnable: setupTransmitter,
          onDisable: function() {
            ocelot.teardownTransmitter(function() {
              serverToggleSwitch.ui.find('input').prop('checked', '');
              serverToggleSwitch.label.text('Transmitter is OFF');
            });
          },
          performance:false, debug:false, verbose:false
        });

        changePortButton.click(setupTransmitter);

        portInput.keypress(function (e) {
          if (e.which == 13) {
            $(this).blur();
            changePortButton.focus().click();
          }
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

