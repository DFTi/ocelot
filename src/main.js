var Ocelot = require("./src/ocelot/ocelot.js"),
ocelot = new Ocelot(),
ui = require("./src/ocelot/ui.js")(ocelot);

//global.ocelot = ocelot;
global.$ = $;
global.ui = ui;

process.env.PORT = process.env.PORT || 7777;

$(document).ready(function() {
  ui.rx.render(JST['templates/receiver']({
    queue: [],
    settings: {}
  }));

  ui.tx.render(JST['templates/transmitter']({
    receivers: [],
    activity: []
  }));

  $("#menu #rx-tab").click(ui.rx.show);
  $("#menu #tx-tab").click(ui.tx.show);
  ui.rx.show();
});
