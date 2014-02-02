
 /* Poll this host for index.json -- if we get one, save it and work on it
   * until we get all the parts so we can concat and get the final file */
  receive: function(host) {
    if (data.rx.poll) { clearInterval(data.rx.poll); };
    var interval = 5000;
    data.rx.base = "http://"+host;
    ui.rx.log("Target set to "+data.rx.base);

    data.rx.poll = setInterval(this.receiverNextTick.bind(this), interval);
    this.receiverNextTick();
  },

  receiverNextTick: function() {
    request(data.rx.base+"/index.json", function(error, response, body) {
      if (!error) {
        this.downloadUsingIndex(JSON.parse(body));
      }
    }.bind(this));
  },

  downloadUsingIndex: function(index) {
    var base = data.rx.base;
    var length = Object.keys(index).length;
    var verifiedParts = 0;
    Object.keys(index).forEach(function(offset, i) {
      // Check info about this offset, initialize if no info
      if (!data.rx.index[offset]) {
        data.rx.index[offset] = {
          status: DONT_GOT,
          path: temp.path({prefix: offset, suffix: '.part'})
        };
      }
      var label = "part "+(i+1)+" of "+length;
      // Check status of the offset, act accordingly
      var status = data.rx.index[offset].status;
      ui.rx.log(offset+" : "+status);
      switch (status) {
        case DONT_GOT: {
          data.rx.index[offset].status = GETTING;
          var downloadURL = base+"/offset/"+offset;
          var downloadPath = data.rx.index[offset].path;
          var downloadFile = filed(downloadPath);
          var r = request(downloadURL).pipe(downloadFile);
          /*r.on('data', function(data) {
            console.log("offset "+offset+"data", data);
          // good place for progress bar
          }); */
          downloadFile.on('end', function () {
            data.rx.index[offset].status = GOT;
          });

          downloadFile.on('error', function (err) {
            ui.rx.log(label+" failed in transit, will retransmit.");
            data.rx.index[offset].status = DONT_GOT; 
          });
          break;
        }
        case GETTING: {
          // TODO check to make sure it's still transferring
          // for now, just trust that we're getting it...
          break;
        }
        case GOT: {
          data.rx.index[offset].status = VERIFYING;
          md5sum(data.rx.index[offset].path, {}, function(hash) {
            if (hash === index[offset]) {
              data.rx.index[offset].status = VERIFIED;
            } else {
              data.rx.index[offset].status = DONT_GOT;
            }
          });
          break;
        }
        case VERIFIED: {
          // Need to find out if all parts are verified
          // if so then we are done and can move onto the 
          // concat phase and rebuild the payload
          ++verifiedParts;
        }
        default: {
          if (verifiedParts === length) {
            var dir = data.rx.binPath;
            if ( fs.existsSync(dir) && fs.statSync(dir).isDirectory() ) {
              if (data.rx.poll) { clearInterval(data.rx.poll); };
              ui.rx.log("All parts verified.");


              var finalPath = path.join(dir, "ocelot.bin");

              if ( fs.existsSync(finalPath) ) {
                fs.unlinkSync(finalPath);
              }

              Object.keys(index).forEach(function(offset, i) {
                var part = data.rx.index[offset];
                ui.rx.log("Appending piece "+part.path);
                fs.appendFileSync(finalPath, fs.readFileSync(part.path));
                if (length === i+1) {
                  ui.rx.log("Done. "+finalPath);
                }
              });
            } else {
              ui.rx.log("Enter a valid directory path to continue");
            }
          }
        }
      }
    });
  }
};

