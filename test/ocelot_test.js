var chai = require('chai');
expect = chai.expect;

var Ocelot = require(__dirname+'/../lib/ocelot.js'),
ocelot = null;

describe("Ocelot", function() {
  beforeEach(function() { ocelot = new Ocelot(); });

  it("uses a part size of about 2.7 MB", function() {
    expect(ocelot.part_size).to.eq(2816000);
  });

  describe("buildIndex()", function() {

    describe("a file smaller than the max part size", function() {

      it("creates only one part", function(done) {
        ocelot.buildIndex(__filename, function(err, parts) {
          expect(Object.keys(parts)).to.have.length(1);
          done();
        });
      });

	

    });


    describe.only("a big file", function() {

      it("creates many parts", function(done) {
	this.timeout(3000);
        ocelot.buildIndex(__dirname+"/bigfile.iso", function(err, parts) {
          expect(Object.keys(parts)).to.have.length(15);
          done();
        });
      });

	

    });

  });
});
