// http://stackoverflow.com/questions/13567312/working-project-structure-that-uses-grunt-js-to-combine-javascript-files-using-r
var fs = require("fs");
var amdclean = require('amdclean');

/*global module:false*/
module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        localConfig: (function(){
            try {
                return grunt.file.readJSON('localConfig.json');
            } catch(e) {
                return {};
            }
        })(),
        connect: {
            server: {
                options: {
                    hostname: '0.0.0.0',
                    port: 3003,
                    base: '.',
                    debug: true,
                }
            },
        },
        requirejs: {
            // Building Custom Mobify.js 2.0 build
            main: {
                options: {
                    wrap: true,
                    baseUrl: ".",
                    paths: {
                        "mobifyjs/utils": "bower_components/mobifyjs-utils/utils",
                        "mobifyjs/jazzcat": "bower_components/jazzcat-client/jazzcat",
                        "mobifyjs/resizeImages": "bower_components/imageresize-client/resizeImages"
                    },
                    optimize: "none",
                    name: "main",
                    out: "../../api/mobify-services.js",
                    onBuildWrite: function(name, path, contents) {
                        return amdclean.clean(contents);
                    }
                }
            },
        },
        watch: {
            files: ["src/**/*",
                  "main.js"
            ],
            tasks: ['build'],
        }
    });

    grunt.loadNpmTasks('grunt-requirejs');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');

    grunt.registerTask('build', ['requirejs:main']);
    grunt.registerTask('preview', ['build', 'connect', 'watch']);
    grunt.registerTask('serve', 'preview');
};
