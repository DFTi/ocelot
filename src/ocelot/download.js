var util = require('util'),
fs = require('graceful-fs'),
path = require('path'),
request = require('request'),
filed = require('filed'),
temp = require('temp'),
md5sum = require(__dirname+'/md5sum.js').file

,   DONT_GOT = 0
,   GETTING = 1
,   GOT = 2
,   VERIFYING = 3
,   VERIFIED = 4

var Download = function(rootObject, remotePayload) {
  "use strict";

  if (!remotePayload.id) {
    throw new Error("expected payload to have an id");
  }
  if (typeof rootObject !== "object") {
    throw new Error("expected a root object");
  }

  if (rootObject[remotePayload.id]) {
    this.data = rootObject[remotePayload.id];
  } else {
    this.data = rootObject[remotePayload.id] = {
      payload: remotePayload,
      offset: {}
    };
  }

  /* Don't reference remotePayload anymore -- it's fleeting */

  this.id = this.data.payload.id;
  this.baseURL = this.data.payload.baseURL;
  this.totalParts = Object.keys(this.data.payload.index).length;
  this.filename = this.data.payload.filename;
  this.eachOffset(function() {});
  this.progress = function() {
    return Math.ceil(this.verifiedParts / this.totalParts * 100);
  }.bind(this)();

  this.binDir = '/Users/keyvan/Projects/ocelot/test/fixtures';
};

Download.prototype.eachOffset = function(cb) {
  this.verifiedParts = 0;
  Object.keys(this.data.payload.index).forEach(function(offset, index) {
    if (!this.data.offset[offset]) {
      this.data.offset[offset] = { status: DONT_GOT, path: null };
    }
    if (this.data.offset[offset].status === VERIFIED) {
      ++this.verifiedParts;
    }
    cb(offset, this.data.offset[offset], index);
  }.bind(this));
};

Download.prototype.remoteHash = function(offset) {
  return this.data.payload.index[offset];
};

/* when you need it you eventually get it. i.e.
 * this method brings the download to a finish */
Download.prototype.needs = function(offset, meta, done, progress) {
  var self = this;

  var retry = function() {
    self.needs(offset, meta, done, progress);
  };

  meta.status = GETTING;
  progress(0);

  var downloadURL = this.baseURL+"/"+this.id+"/"+offset;
  meta.path = temp.path({prefix: this.id+offset, suffix: '.part'});
  var downloadFile = filed(meta.path);
  var r = request(downloadURL).pipe(downloadFile);
  r.on('data', function(data) {
//    console.log("offset "+offset+"data", data);
    // TODO progress bar and throughput
  });

  downloadFile.on('end', function () {
    meta.status = GOT;
    meta.status = VERIFYING;
    md5sum(meta.path, {}, function(hash) {
      if (hash === self.remoteHash(offset)) {
        meta.status = VERIFIED;
        ++self.verifiedParts;
        if (self.verifiedParts === self.totalParts) {
          self.reassemble();
        }
      } else {
        meta.status = DONT_GOT;
      }
    });
  });

  downloadFile.on('error', function (err) {
    meta.status = DONT_GOT;
    retry();
  });
};

Download.prototype.concat = function(done, progress) {
  var self = this;
  var dir = self.binDir;
  if ( fs.existsSync(dir) && fs.statSync(dir).isDirectory() ) {

    var finalPath = path.join(dir, self.filename);

    if ( fs.existsSync(finalPath) ) {
      fs.unlinkSync(finalPath);
    }

    self.eachOffset(function(offset, meta, i) {
      console.log("Appending piece "+meta.path);
      fs.appendFileSync(finalPath, fs.readFileSync(meta.path));
      if (self.totalParts === i+1) {
        console.log("Done. "+finalPath);
        progress(100);
        done();
      }
    });
  } else {
    console.log("Enter a valid directory path to continue");
  }
};

module.exports = Download;
