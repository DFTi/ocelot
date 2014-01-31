var Ocelot = require("./lib/ocelot.js"), ocelot = new Ocelot();
global.ocelot = ocelot;
global.$ = $;

var scrollBottom = function(e) {
  var height = e[0].scrollHeight;
  e.scrollTop(height);
};

$(document).ready(function() {
  var ui = {
    tx: {
      log: function(m) { scrollBottom($('.logs .tx pre').append(m+"\n")) },
      file: $('.tx input[name=file]')
    },
    rx: {
      log: function(m) { scrollBottom($('.logs .rx pre').append(m+"\n")) },
      host: $('.rx input[name=host]')
    }
  };

  global.ui = ui;

  ocelot.server.listen(7777, function () {
    ui.tx.log('Listening on 7777');
  });

  ui.tx.file.change(function(e) { ocelot.serve($(e.target).val()); });
  ui.rx.host.change(function(e) { ocelot.receive($(e.target).val()); });
});
