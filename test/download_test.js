var chai = require('chai'),
sinon = require('sinon');
chai.use(require('sinon-chai'));
expect = chai.expect;

var Download = require(__dirname+'/../src/ocelot/download.js');

// Provide a scope for the download to query and put data into
var root = null;

// Example of a remote payload
var payload = {
  baseURL: 'somewhere',
  filename: 'foo.mp4',
  id: '123',
  size: 324132,
  index: {
    '0':'blabla',
    '1024':'bfawefawf'
  }
};

/*
   var storedData = {
// Contains the data that came from the server as a payload
remote: {
},
// and local work data like offset status
}
*/

describe("Download", function() {
  beforeEach(function() { dl = null; });

  describe("without existing stored data in the root object", function() {
    beforeEach(function() {
      root = {
        xfers: {}
      };
      // This is how we construct a download in the app
      dl = new Download(root.xfers, payload);
    });

    it("should have 0 verified parts", function() {
      expect(dl.verifiedParts).to.eq(0);
    });

    it("writes to the root object using the payload id as the key", function() {
      expect(root.xfers[payload.id]).to.be.ok;
    });

    it("provides an offset iterator that calls with offset, its metadata, and index", function() {
      var spy = sinon.spy();
      dl.eachOffset(spy);
      expect(spy).to.have.callCount(2);
      expect(spy.getCall(1)).to.have.been.calledWith('1024', { status: 0, path: null }, 1);
    });

    it("offset iterator initializes local offset metadata into the root object", function() {
      dl.eachOffset(sinon.stub());
      expect(root.xfers[payload.id].offset['1024'].status).to.eq(0);
      expect(root.xfers[payload.id].offset['0'].path).to.be.null;
    });

  });


  describe("with existing stored data in root object", function() {
    beforeEach(function() {
      payload = {
        baseURL: 'somewhere',
        filename: 'foo.mp4',
        id: '123',
        size: 324132,
        index: {
          '0': 'blabla',
          '1024': 'bfawefawf',
          '2048': 'adwawd',
          '4056': 'awefawef'
        }
      };
      root = {
        xfers: {
          '123': {
            payload: payload,
            offset: {
              '0': {
                status: 4,
                path: null
              },
              '1024': {
                status: 0,
                path: null
              },
              '2048': {
                status: 2,
                path: null
              },
              '4056': {
                status: 2,
                path: null
              }
            }
          }
        }
      };
      dl = new Download(root.xfers, payload);
    });


    it("shows us how many verified parts", function() {
      expect(dl.verifiedParts).to.eq(1);
    });

    it("tells us how many totalParts", function() {
      expect(dl.totalParts).to.eq(4);
    });

    describe("progress", function() {
      it("can tell us % of verified chunks", function() {
        expect(dl.progress).to.eq(25);
      });
    });

    it("has a base url", function() {
      expect(dl.baseURL).to.eq('somewhere');
    });

    it("has an id", function() {
      expect(dl.id).to.eq('123');
    });

    it("gives us the filename", function() {
      expect(dl.filename).to.eq('foo.mp4');
    });

    it("gives us the remote md5 for the chunk at offset", function() {
      expect(dl.remoteHash('1024')).to.eq('bfawefawf');
    });
  });
});
