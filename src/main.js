global.$ = $;
process.env.PORT = process.env.PORT || 7777;

var Ocelot = require("./src/ocelot/ocelot.js"),
ocelot = new Ocelot(),
ui = require("./src/ocelot/ui.js")(ocelot);

$(document).ready(function() {
  ui.rx.render(JST['templates/receiver']({
    queue: [],
    settings: {}
  }));

  ui.tx.render(JST['templates/transmitter']({
    receivers: [{
      name: "TEst",
      id: "234234234"
    }],
    activity: []
  }));


  $("#menu #rx-tab").click(ui.rx.show);
  $("#menu #tx-tab").click(ui.tx.show);
  ui.rx.show();
});
