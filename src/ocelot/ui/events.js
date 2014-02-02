var fs = require('fs');

module.exports = function(ocelot, ui) {
  ocelot.on('ui:rx:connected', function() {
    console.log("Receiver Connected");
    $('.remote-host .icon').removeClass('red').addClass('green');
    $('.remote-host').removeClass('loading');
  });

  ocelot.on('ui:rx:disconnected', function() {
    console.log("Receiver Disconnected");
    $('.remote-host .icon').removeClass('green').addClass('red');
    $('.remote-host').removeClass('loading');
  });

  /* Add new receiver to the UI. Example: 
   * ocelot.emit('ui:tx:add_receiver', {id: 1, name: 'fake'}); */
  ocelot.on('ui:tx:add_receiver', function(data) {
    var $receiver = $(JST['templates/tx/receiver'](data));

    $('.message.no-receivers').addClass('hidden');

    $('table.receivers tbody').append($receiver);

    $receiver.find('.ui.checkbox').checkbox({
      performance:false, debug:false, verbose:false
    })

    $('table.receivers').removeClass('hidden');
    $('.input.transmission').removeClass('hidden');

    var sendTransmission = $('.input.transmission .queue.button');
    var defaultText = sendTransmission.text();
    var indexing = false;
    sendTransmission.off().click(function() {
      if (indexing) { return false; }
      var filepath = $('input[name=fileToTransmit]').val();
      if (filepath.length === 0) {
        window.alert("Select a file to transmit");
        return false;
      } else if (!fs.existsSync(filepath)){
        window.alert('invalid file path');
        return false;
      } else {

        var ids = $('.receivers tr.receiver[id]').map(function(i, el) {
          if ($(el).find('.ui.checkbox').checkbox('is').enabled()) {
            return el.id
          }
        }).toArray();

        if (ids.length < 1) {
          window.alert('Select at least one receiver to send this file to');
          return false;
        }

        sendTransmission.text('Indexing');
        indexing = true;

        ocelot.queueTransmission(filepath, ids, function(c) {
          sendTransmission.text("Indexing (100 %)");
          $('.receivers tr.receiver .ui.checkbox').checkbox('disable');
          setTimeout(function() {
            indexing = false;
            sendTransmission.text(defaultText);
            window.alert("Delivered payload to "+c+" recipients. Expect that they will get "+filepath+" eventually.");
          }, 300);
        }, function (percent) {
          sendTransmission.text("Indexing ("+percent+" %)");
        });
      }
    });
  });

  ocelot.on('ui:tx:del_receiver', function(data) {

    $('table.receivers #'+data.id).remove();
    
    if ($('table.receivers tbody tr').length === 0) {
      $('table.receivers').addClass('hidden');
      $('.message.no-receivers').removeClass('hidden');
      $('.input.transmission').addClass('hidden');
    }
  });
};
