module.exports = function(grunt) {
  grunt.registerTask("rand40", function() {
    var done = this.async();
    grunt.util.spawn({
      cmd: "dd",
      args: ['if=/dev/urandom', 'of=test/fixtures/40meg.iso', 'bs=4m', 'count=10']
    }, function(err, res, code) {
      grunt.log.writeln(String(res));
      done();
    });
  });
}
