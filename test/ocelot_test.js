var chai = require('chai'),
sinon = require('sinon');
chai.use(require('sinon-chai'));
expect = chai.expect;

var Ocelot = require(__dirname+'/../src/ocelot/ocelot.js'),
MD5 = /^[0-9a-f]{32}$/i;

describe("Ocelot", function() {
  var ocelot = null;
  beforeEach(function() { ocelot = new Ocelot(); });

  describe("buildIndex()", function() {

    describe("a file smaller than the max part size", function() {
      it("creates only one part", function(done) {
        ocelot.buildIndex(__filename, function(err, parts) {
          expect(parts[Object.keys(parts)[0]]).to.match(MD5);
          expect(Object.keys(parts)).to.have.length(1);
          done();
        });
      });
    });


    describe("a 40MB file", function() {
      it("reports percentage every time it works a chunk", function(done) {
        var spy = sinon.spy();
        ocelot.buildIndex(__dirname+"/fixtures/40meg.iso", function() {
          expect(spy).to.have.callCount(15);
          [ 7, 14, 20, 27, 34, 40, 47, 54, 60, 67, 74, 80, 87, 94, 100]
          .forEach(function(percent, index) {
            expect(spy.getCall(index).args[0]).to.eq(percent);
          });
          done();
        }, spy);
      });

      it("creates many parts", function(done) {
        ocelot.buildIndex(__dirname+"/fixtures/40meg.iso", function(err, parts) {
          expect(parts[Object.keys(parts)[0]]).to.match(MD5);
          expect(Object.keys(parts)).to.have.length(15);
          done();
        });
      });
    });
  });

  describe("setupReceiver()", function() {
    it("connects to a socket.io server", function() {
    });
  });
});
