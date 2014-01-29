global.$ = $;

var fs = require('fs');

$(document).ready(function() {
  $('#send button[type=submit]').click(function() {
    var filepath = $('#send #file').val();
    fs.exists(filepath, function(exists) {
      if (exists) {
        alert("queuing file "+filepath+" for clients that have this key");
      } else {
        alert('no such file');
      }
    });
  });  
});
