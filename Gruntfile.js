// http://stackoverflow.com/questions/13567312/working-project-structure-that-uses-grunt-js-to-combine-javascript-files-using-r
var fs = require("fs");
var path = require('path');

var LONG_CACHE_CONTROL = "public,max-age=31536000, s-maxage=900"; // one year
var SHORT_CACHE_CONTROL = "public,max-age=300"; // five minutes
var NO_CACHE = "max-age=0, no-store";

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
        lint: {
            files: ['grunt.js', 'src/**/*.js', 'tests/**/*.js']
        },
        qunit: {
            all: {
              options: {
                timeout: 10000,
                urls: [
                  'http://localhost:3000/tests/mobify-library.html',
                  'http://localhost:3000/tests/capture.html',
                  'http://localhost:3000/tests/jazzcat.html',
                  'http://localhost:3000/tests/resizeImages.html',
                  'http://localhost:3000/tests/unblockify.html',
                  'http://localhost:3000/tests/cssOptimize.html',
                  'http://localhost:3000/tests/timing.html'
                ]
              }
            }
        },
        express: {
            custom: {
                options: {
                    hostname: '0.0.0.0',
                    port: 3000,
                    base: '.',
                    server: path.resolve("./server")
                }
            }
        },
        requirejs: {
            // Building full Mobify.js library
            full: {
                options: {
                    almond: true,
                    mainConfigFile: "./src/config.js",
                    optimize: "none",
                    keepBuildDir: true,
                    name: "mobify-library",
                    out: "./build/mobify-<%= pkg.version %>.js"
                }
            },
            // Mobify.js Library with added timing API
            timing: {
                options: {
                    almond: true,
                    mainConfigFile: "./src/config.js",
                    optimize: "none",
                    keepBuildDir: "true",
                    name: "mobify-library-timing",
                    out: "./build/mobify-timing.js"
                }
            },
            // Building custom Mobify.js library (must copy mobify-custom.js.example -> mobify-custom.js)
            custom: {
                options: {
                    almond: true,
                    mainConfigFile: "./src/config.js",
                    optimize: "none",
                    keepBuildDir: true,
                    name: "../mobify-custom.js",
                    out: "./build/custom/mobify.js"
                }
            }
        },
        uglify: {
            full: {
                files: {
                    'build/mobify-<%= pkg.version %>.min.js':
                        ['build/mobify-<%= pkg.version %>.js']
                }
            },
            timing: {
                files: {
                    'build/mobify-timing.min.js':
                        ['build/mobify-timing.js']
                }
            },
            custom: {
                files: {
                    'build/custom/mobify.min.js': ['build/custom/mobify.js']
                }
            }
        },
        watch: {
            files: ["src/**/*.js",
                  "mobify-custom.js"
            ],
            tasks: ['build'],
        },
        'saucelabs-qunit': {
            all: {
                options: {
                    username: '<%= localConfig.saucelabs.username %>', // if not provided it'll default to ENV SAUCE_USERNAME (if applicable)
                    key: '<%= localConfig.saucelabs.key %>', // if not provided it'll default to ENV SAUCE_ACCESS_KEY (if applicable)
                    urls: [
                        'http://localhost:3000/tests/mobify-library.html',
                        'http://localhost:3000/tests/capture.html',
                        'http://localhost:3000/tests/resizeImages.html',
                        'http://localhost:3000/tests/jazzcat.html',
                        'http://localhost:3000/tests/unblockify.html',
                        'http://localhost:3000/tests/cssOptimize.html',
                        'http://localhost:3000/tests/timing.html'
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
                        { // Lowest known working version of FF
                            browserName: 'opera',
                            platform: 'Windows 2003',
                            version: '11'
                        },
                        { // Highest known working version of Opera
                            browserName: 'opera',
                            platform: 'Windows 2008',
                            version: '12'
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
                        { // Lowest known working version of FF
                            browserName: 'firefox',
                            version: '4.0'
                        },
                        { // Highest known working version of FF on Windows
                            browserName: 'firefox',
                            version: '18.0'
                        },
                        { // Highest FF on OSX
                            browserName: 'firefox',
                            platform: 'Mac 10.6',
                            version: '14.0'
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
        },
        s3: {
            options: {
                key: '<%= localConfig.aws.key %>',
                secret: '<%= localConfig.aws.secret %>',
                access: "public-read",
                headers: { "Cache-Control": SHORT_CACHE_CONTROL },
                maxOperations: 6
            },
            build: {
                options: {
                    bucket: 'mobify',
                    gzip: true
                },
                upload: [
                    { // build
                        src: "build/**/*",
                        dest: "mobifyjs/build/",
                        rel: "build",
                    }
                ]
            },
            examples: {
                options: {
                    bucket: 'mobify',
                    gzip: true
                },
                upload: [
                    { // examples
                        src: "examples/**/*",
                        dest: "mobifyjs/examples/",
                        rel: "examples",
                    }
                ]
            },
            performance: {
                options: {
                    bucket: 'mobify',
                    headers: { "Cache-Control": NO_CACHE},
                },
                upload: [
                    { // examples
                        src: "performance/**/*",
                        dest: "mobifyjs/performance/",
                        rel: "performance",
                    }
                ]
            },
            wwwstaging: {
                options: {
                    bucket: 'www-staging.mobify.com',
                },
                upload: [
                    {
                       src: "www/_site/**/*",
                       dest: "mobifyjs",
                       rel: "www/_site"
                    },
                ]
            },
            wwwstagingstatic: {
                options: {
                    bucket: 'www-staging.mobify.com',
                    headers: { "Cache-Control": LONG_CACHE_CONTROL }
                },
                upload: [
                    {
                        src: "www/_site/static/**/*",
                        dest: "mobifyjs",
                        rel: "www/_site",
                    }
                ]
            },
            wwwprod: {
                options: {
                    bucket: 'www.mobify.com',
                },
                upload: [
                    {
                       src: "www/_site/**/*",
                       dest: "mobifyjs",
                       rel: "www/_site"
                    },
                ]
            },
            wwwprodstatic: {
                options: {
                    bucket: 'www.mobify.com',
                    headers: { "Cache-Control": LONG_CACHE_CONTROL }
                },
                upload: [
                    {
                        src: "www/_site/static/**/*",
                        dest: "mobifyjs",
                        rel: "www/_site",
                    }
                ]
            },
        },
        jekyll: {
            server: {
                src: './www',
                dest: './www/_site',
                server: true,
                server_port: 4000,
                watch: true
            },
            build: {
                src: './www',
                dest: './www/_site',
            },
        }
    });

    grunt.loadNpmTasks('grunt-requirejs');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-saucelabs');
    grunt.loadNpmTasks('grunt-s3');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-jekyll');
    grunt.loadNpmTasks('grunt-express');

    grunt.registerTask('test', ['express', 'qunit']);
    // Builds librarys, and custom library if mobify-custom.js is present
    grunt.registerTask('build', function() {
        // Then build mobify.js library
        grunt.task.run("requirejs:full", "uglify:full");
        grunt.task.run("requirejs:timing", "uglify:timing");
        // Build custom library if it exists
        if (grunt.file.exists("mobify-custom.js")) {
            grunt.task.run("requirejs:custom", "uglify:custom");
        }
    });
    grunt.registerTask('default', 'build');
    grunt.registerTask('deploy', ['build', 's3:build', 's3:examples']);
    grunt.registerTask('wwwstagingdeploy', ['jekyll:build', 's3:wwwstaging', 's3:wwwstagingstatic']);
    grunt.registerTask('wwwproddeploy', ['jekyll:build', 's3:wwwprod', 's3:wwwprodstatic']);
    grunt.registerTask('saucelabs', ['test', 'saucelabs-qunit']);
    grunt.registerTask('serve', ['build', 'express', 'watch']);
    grunt.registerTask('preview', 'serve'); // alias to serve
};
