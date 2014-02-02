
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
};

