// http://stackoverflow.com/questions/13567312/working-project-structure-that-uses-grunt-js-to-combine-javascript-files-using-r
var fs = require("fs");
/*global module:false*/
module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        connect: {
            server: {
                options: {
                    hostname: '0.0.0.0',
                    port: 3000,
                    base: '.',
                    debug: true,
                }
            },
        },
        requirejs: {
            // Building custom file which brings is certain Mobify client libraries
            main: {
                options: {
                    wrap: true,
                    baseUrl: ".",
                    paths: {
                        "mobifyjs/utils": "vendor/mobify-service-clients/bower_components/mobifyjs-utils/utils",
                        "mobifyjs/jazzcat": "vendor/mobify-service-clients/bower_components/jazzcat-client/jazzcat",
                        "mobifyjs/resizeImages": "vendor/mobify-service-clients/bower_components/imageresize-client/resizeImages"
                    },
                    almond: true,
                    optimize: "none",
                    name: "vendor/mobify-service-clients/main",
                    out: "api/mobify-services.js",
                }
            },
        },
        watch: {
            files: ["vendor/mobify-service-clients/src/**/*",
                  "vendor/mobify-service-clients/main.js"
            ],
            tasks: ['build'],
        },
        qunit: {
            all: {
                options: {
                    timeout: 20000,
                    urls: [
                      'http://localhost:3000/tests/index.html',
                    ]
                }
            }
        },
        'saucelabs-qunit': {
            all: {
                options: {
                    // Set the Saucelabs username and key in your environment variables
                    // by setting SAUCE_USERNAME and SAUCE_ACCESS_KEY
                    urls: [
                        'http://localhost:3000/tests/index.html'
                    ],
                    concurrency: 16,
                    tunneled: true,
                    detailedError: true,
                    browsers: [ //https://saucelabs.com/docs/platforms
                        { // Only working version of IE compatable
                            browserName: 'internet explorer',
                            platform: 'Windows 2012',
                            version: '10'
                        },
                        { // Only working version of IE compatable
                            browserName: 'internet explorer',
                            platform: 'Windows 8.1',
                            version: '11'
                        },
                        { // Latest Chrome on Windows XP
                            browserName: 'chrome',
                            platform: 'Windows 2003'
                        },
                        { // Latest Chrome on Windows 7
                            browserName: 'chrome',
                            platform: 'Windows 2008'
                        },
                        { // Latest Chrome on Linux (unknown distro)
                            browserName: 'chrome',
                            platform: 'Linux'
                        },
                        { // Latest Chrome on Linux (unknown distro)
                            browserName: 'chrome',
                            platform: 'OS X 10.8'
                        },
                        { // Highest known working version of FF on Windows
                            browserName: 'firefox',
                            version: '18.0'
                        },
                        { // Lowest iPad on OSX (simulator)
                            browserName: 'ipad',
                            platform: 'Mac 10.6',
                            version: '4.3'
                        },
                        { // Highest iPad on OSX (simulator)
                          // NOTE: iOS 6 is available, but it hangs on SauceLabs...
                            browserName: 'ipad',
                            platform: 'Mac 10.6',
                            version: '5'
                        },
                        { // Lowest iPhone on OSX (simulator)
                            browserName: 'iphone',
                            platform: 'Mac 10.6',
                            version: '4.3'
                        },
                        { // Highest iPhone on OSX (simulator)
                          // NOTE: iOS 6 is available, but it hangs on SauceLabs...
                            browserName: 'iphone',
                            platform: 'Mac 10.6',
                            version: '5'
                        },
                        { // Android 4.0 (simulator)
                            browserName: 'android',
                            platform: 'Linux',
                            version: '4'
                        }
                    ], // https://saucelabs.com/docs/browsers
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
        }
    });

    grunt.loadNpmTasks('grunt-requirejs');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-saucelabs');

    grunt.registerTask('test', ['connect', 'qunit']);
    grunt.registerTask('saucelabs', ['test', 'saucelabs-qunit']);
    grunt.registerTask('build', ['requirejs:main']);
    grunt.registerTask('preview', ['build', 'connect', 'watch']);
    grunt.registerTask('serve', 'preview');
};
