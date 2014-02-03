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

  /* Add a new download to the Receiver UI. */
  ocelot.on('ui:rx:add_download', function(data) {
    if ($('tr.download[id='+data.id+']').length > 0) {
      console.log("Someone tried to send the same file again. Ignoring");
      return false;
    }
    var $download = $(JST['templates/rx/download'](data));
    $download.data('index', data.index); // Bad place to store the index?
    $download.data('id', data.id); // Used to create URL for part fetching
    $('.message.no-downloads').addClass('hidden');
    $('table.downloads tbody').append($download);
    $('table.downloads').removeClass('hidden');
    ocelot.on('ui:rx:download:'+data.id+':progress', function(percent) {
      $download.find('.progress .bar').css('width', percent+'%');
    });
  });


  /* Add new receiver to the Transmitter UI. Example: 
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

        sendTransmission.text('Preparing to index ...');
        indexing = true;

        ocelot.queueTransmission(filepath, ids, function(c, filename) {
          sendTransmission.text("Indexing (100 %)");
          $('.receivers tr.receiver .ui.checkbox').checkbox('disable');
          setTimeout(function() {
            indexing = false;
            sendTransmission.text(defaultText);
            $('input[name=fileToTransmit]').val('');
            window.alert("Delivered payload to "+c+" recipients. Expect that they will get "+filename+" eventually.");
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
