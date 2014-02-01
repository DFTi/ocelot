global.$ = $;
process.env.PORT = process.env.PORT || 7777;

var Ocelot = require("./src/ocelot/ocelot.js"),
ocelot = new Ocelot(),
ui = require("./src/ocelot/ui.js")(ocelot),

renderRx = function(data) {
  ui.rx.render(JST['templates/receiver'](data));
},

renderTx = function(data) {
  ui.tx.render(JST['templates/transmitter'](data));
},

renderUI = function() {
  renderRx({
    queue: [],
    settings: {}
  });

  renderTx({
    receivers: [],
    activity: []
  });
};

$(document).ready(function() {
  ocelot.on('ui:rx:update', renderRx);
  ocelot.on('ui:tx:update', renderTx); /* dont do this, make it more
  granular and never just blatantly update the whole thing again...
 implement the proper jquery stuff in additional ui modules */

  renderUI(/* good place to load persisted json */);

  $("#menu #rx-tab").click(ui.rx.show);
  $("#menu #tx-tab").click(ui.tx.show);
  ui.rx.show();
});
