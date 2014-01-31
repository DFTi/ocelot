var chai = require('chai');
expect = chai.expect;

var Ocelot = require(__dirname+'/../lib/ocelot.js'),
ocelot = null,
MD5 = /^[0-9a-f]{32}$/i;

describe("Ocelot", function() {
  beforeEach(function() { ocelot = new Ocelot(); });

  it("uses a part size of about 2.7 MB", function() {
    expect(ocelot.part_size).to.eq(2816000);
  });

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
      it("creates many parts", function(done) {
        ocelot.buildIndex(__dirname+"/fixtures/40meg.iso", function(err, parts) {
          expect(parts[Object.keys(parts)[0]]).to.match(MD5);
          expect(Object.keys(parts)).to.have.length(15);
          done();
        });
      });
    });
  });

  describe("receive()", function() {
    describe("when the host is active and will return index.json", function() {
      it("saves the remote index in memory", function() {
        //ocelot.receive("localhost:1234");
      });
    });
  });
});
