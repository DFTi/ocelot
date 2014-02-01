var node_webkit_window = {
  //"frame": false,
  "width": 1000,
  "height": 500
};

module.exports = function(grunt) {
  grunt.initConfig({
    clean: ["build"],
    cssmin: {
      combine: {
        files: {
          "build/css/app.css": "css/**/*.css"
        }
      }
    },
    copy: {
      main: {
        src: [
          'node_modules/express/**/*',
          'node_modules/request/**/*',
          'node_modules/temp/**/*',
          'node_modules/graceful-fs/**/*',
          'node_modules/filed/**/*',
          'node_modules/socket.io/**/*',
          'fonts/**/*',
          'images/**/*',
          'package.json'
        ],
        dest: "build/"
      },
      wildcat: {
        options: {
          flatten: true
        },
        src: [
          'src/ocelot/**/*.js'
        ],
        dest: 'build/'
      }
    },
    jade: {
      index: {
        files: { "build/index.html": ['templates/index.jade'] }
      },
      templates: {
        options: {
          client: true
        },
        files: {
          "tmp/templates.js": [
            'templates/receiver.jade',
            'templates/transmitter.jade'
          ]
        }
      }
    },
    concat: {
      options: {
        separator: ';'
      },
      dist: {
        src: [
          'src/3rd_party/jquery-2.1.0.min.js',
          'src/3rd_party/jquery.address.js',
          'src/3rd_party/semantic.js',
          'src/3rd_party/runtime.js',
          'node_modules/socket.io/node_modules/socket.io-client/dist/socket.io.js',
          'tmp/templates.js',
          'src/main.js'
        ],
        dest: "build/js/app.js"
      }
    },
  });

  grunt.registerTask('default', [
    'clean',
    'cssmin',
    'jade',
    'concat',
    'copy',
  ]);

  grunt.registerTask('set:nw:window', 'Set node-webkit window settings', function() {
    var fs = require('fs'), done = this.async();
    fs.readFile('./build/package.json', function(err, data){
      if (err) throw err;
      var json = JSON.parse(data);
      json.window = node_webkit_window;
      fs.writeFile('./build/package.json', JSON.stringify(json), function(err, data) {
        if (err) throw err;
        console.log(json.window);
        done();
      });
    })
  });
 
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


  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-jade');
}
