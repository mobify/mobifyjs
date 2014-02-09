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
                    mainConfigFile: "./config.js",
                    optimize: "none",
                    keepBuildDir: true,
                    name: "main",
                    out: "./build/mobifyjs-2.0-service-apis.js",
                    onBuildWrite: function(name, path, contents) {
                        return amdclean.clean(contents);
                    }
                }
            },
        },
        uglify: {
            main: {
                files: {
                    'build/mobifyjs-2.0-service-apis.min.js': ['build/mobifyjs-2.0-service-apis.js']
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
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('build', ['requirejs:main', 'uglify:main']);
    grunt.registerTask('preview', ['build', 'connect', 'watch']);
    grunt.registerTask('serve', 'preview');
};
