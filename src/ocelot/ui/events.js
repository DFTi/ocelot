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

  ocelot.on('ui:tx:add_receiver', function(data) {
    var $receiver = $(JST['templates/tx/receiver'](data));

    $('.message.no-receivers').addClass('hidden');

    $('table.receivers tbody').append($receiver);

    $receiver.find('.ui.checkbox').checkbox({
      performance:false, debug:false, verbose:false
    })


    $('table.receivers').removeClass('hidden');
    $('.input.transmission').removeClass('hidden');
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
