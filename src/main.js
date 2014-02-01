global.$ = $;
global.JST = JST;
process.env.PORT = process.env.PORT || 7777;

var Ocelot = require("./src/ocelot/ocelot.js"),
ocelot = new Ocelot(),
ui = require("./src/ocelot/ui.js")(ocelot),
events = require('./src/ocelot/ui/events.js')(ocelot, ui);

$(document).ready(function() {
  ui.rx.render(JST['templates/rx/layout']({queue:[]}));
  ui.rx.show();
  $("#menu #tx-tab").click(ui.tx.show);
  ui.tx.render(JST['templates/tx/layout']({activity:[]}));
  $("#menu #rx-tab").click(ui.rx.show);
});
