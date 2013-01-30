// http://stackoverflow.com/questions/13567312/working-project-structure-that-uses-grunt-js-to-combine-javascript-files-using-r


/*global module:false*/
module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: '<json:package.json>',
        localConfig: (function(){ 
                        try { 
                            return grunt.file.readJSON('localConfig.json') 
                        } catch(e) {
                            return {} 
                        }
                    })() ,
        meta: {
          banner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
            '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
            '<%= pkg.homepage ? "* " + pkg.homepage + "\n" : "" %>' +
            '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
            ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */'
        },
        lint: {
            files: ['grunt.js', 'src/**/*.js', 'tests/**/*.js']
        },
        qunit: {
            all: {
              options: {
                urls: [
                  'http://localhost:3000/tests/capture.html',
                ]
              }
            }
        },
        connect: {
            server: {
                options: {
                    hostname: '0.0.0.0',
                    port: 3000,
                    base: '.'
                }
            }
        },
        requirejs: {
            // Building capturing only
            capture: {
                options: {
                    almond: true,
                    mainConfigFile: "./src/config.js",
                    optimize: "none",
                    keepBuildDir: true,
                    name: "mobify-capture",
                    out: "./build/mobify-capture.js",
                }
            },
            // Build resizeImages only
            resizeImages: {
                options: {
                    almond: true,
                    mainConfigFile: "./src/config.js",
                    optimize: "none",
                    keepBuildDir: true,
                    name: "mobify-resizeImages",
                    out: "./build/mobify-resizeImages.js",
                }
            },
            // Build enhance only - TODO: Rename!!!
            enhance: {
                options: {
                    almond: true,
                    mainConfigFile: "./src/config.js",
                    optimize: "none",
                    keepBuildDir: true,
                    name: "mobify-enhance",
                    out: "./build/mobify-enhance.js",
                }
            },
            // Building full Mobify.js library
            full: {
                options: {
                    almond: true,
                    mainConfigFile: "./src/config.js",
                    optimize: "none",
                    keepBuildDir: true,
                    name: "mobify-full",
                    out: "./build/mobify.js",
                }
            },
            // Building full Mobify.js library
            fullOptimized: {
                options: {
                    almond: true,
                    mainConfigFile: "./src/config.js",
                    keepBuildDir: true,
                    name: "mobify-full",
                    out: "./build/mobify.min.js",
                }
            }
        },
        watch: {
          files: 'src/**/*.js',
          tasks: ['requirejs'],
        },
        'saucelabs-qunit': {
            all: {
                username: '<%= localConfig.saucelabs.username %>', // if not provided it'll default to ENV SAUCE_USERNAME (if applicable)
                key: '<%= localConfig.saucelabs.key %>', // if not provided it'll default to ENV SAUCE_ACCESS_KEY (if applicable)
                urls: ['http://localhost:3000/tests/capture.html'],
                concurrency: 1,
                tunneled: true,
                browsers: [
                { // Only working version of IE compatable
                    browserName: 'internet explorer',
                    version: '10'
                },
                { // Always tests latest Chrome (on Windows)
                    browserName: 'chrome',
                },
                { // Lowest known working version of FF
                    browserName: 'firefox',
                    version: '4.0' 
                },
                { // Highest known working version of FF
                    browserName: 'firefox',
                    version: '18.0'
                }], // https://saucelabs.com/docs/browsers
                onTestComplete: function(){
                    // Called after a qunit unit is done, per page, per browser
                    // Return true or false, passes or fails the test
                    // Returning undefined does not alter the test result

                    // For async return, call 
                    var done = this.async();
                    setTimeout(function(){
                        // Return to this test after 1000 milliseconds
                        done(/*true or false changes the test result, undefined does not alter the result*/);
                    }, 1000);
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-requirejs');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-saucelabs');

    // Default task.
    // grunt.registerTask('default', 'lint qunit requirejs');
    //grunt.registerTask('skiptests', 'concat');
    grunt.registerTask('default', ['requirejs:resizeImages',
                                   'requirejs:capture',
                                   'requirejs:enhance',
                                   'requirejs:full',
                                   'requirejs:fullOptimized']);
    grunt.registerTask('capture', 'requirejs:capture');
    grunt.registerTask('full', 'requirejs:full');
    grunt.registerTask('test', ['connect', 'qunit']);
    grunt.registerTask('saucelabs', ['test', 'saucelabs-qunit']);
    grunt.registerTask('preview', ['connect', 'watch']);
};
