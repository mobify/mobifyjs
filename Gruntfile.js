// http://stackoverflow.com/questions/13567312/working-project-structure-that-uses-grunt-js-to-combine-javascript-files-using-r


/*global module:false*/
module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        localConfig: (function(){ 
                        try { 
                            return grunt.file.readJSON('localConfig.json') 
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
            // Building full Mobify.js library
            full: {
                options: {
                    almond: true,
                    mainConfigFile: "./src/config.js",
                    optimize: "none",
                    keepBuildDir: true,
                    name: "mobify-full",
                    out: "./build/mobify-<%= pkg.version %>.js",
                }
            },
            fullOptimized: {
                options: {
                    almond: true,
                    mainConfigFile: "./src/config.js",
                    keepBuildDir: true,
                    name: "mobify-full",
                    out: "./build/mobify-<%= pkg.version %>.min.js",
                }
            },
            // Building experimental swift features
            swift: {
                options: {
                    almond: true,
                    mainConfigFile: "./src/config.js",
                    optimize: "none",
                    keepBuildDir: true,
                    name: "mobify-swift",
                    out: "./build/mobify-swift-<%= pkg.version %>.js",
                }
            },
            swiftOptimized: {
                options: {
                    almond: true,
                    mainConfigFile: "./src/config.js",
                    keepBuildDir: true,
                    name: "mobify-swift",
                    out: "./build/mobify-swift-<%= pkg.version %>.min.js",
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
                    out: "./build/custom/mobify.js",
                }
            },
            customOptimized: {
                options: {
                    almond: true,
                    mainConfigFile: "./src/config.js",
                    keepBuildDir: true,
                    name: "../mobify-custom.js",
                    out: "./build/custom/mobify.min.js",
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
                username: '<%= localConfig.saucelabs.username %>', // if not provided it'll default to ENV SAUCE_USERNAME (if applicable)
                key: '<%= localConfig.saucelabs.key %>', // if not provided it'll default to ENV SAUCE_ACCESS_KEY (if applicable)
                urls: ['http://localhost:3000/tests/capture.html'],
                concurrency: 2,
                tunneled: true,
                detailedError: true,
                browsers: [
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
        },
        s3: {
            key: '<%= localConfig.aws.key %>',
            secret: '<%= localConfig.aws.secret %>',
            bucket: '<%= localConfig.aws.bucket %>',
            access: "public-read",
            headers: { "Cache-Control": "max-age=1200" },
            upload: [
                { // build
                    src: "build/**/*",
                    dest: "mobifyjs/build/",
                    rel: "build"
                },
                { // examples
                    src: "examples/**/*",
                    dest: "mobifyjs/examples/",
                    rel: "examples"
                }
            ]
        }
    });

    grunt.loadNpmTasks('grunt-requirejs');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-saucelabs');
    grunt.loadNpmTasks('grunt-s3');

    grunt.registerTask('test', ['connect', 'qunit']);
    // Builds librarys, and custom library if mobify-custom.js is present
    grunt.registerTask('build', function() {
        // Then build mobify.js library
        grunt.task.run("requirejs:full", "requirejs:fullOptimized")
        grunt.task.run("requirejs:swift", "requirejs:swiftOptimized")
        // Build custom library if it exists
        if (grunt.file.exists("mobify-custom.js")) {
            grunt.task.run("requirejs:custom", "requirejs:customOptimized");
        }
    });
    grunt.registerTask('default', 'build');
    grunt.registerTask('deploy', ['build', 's3']);
    grunt.registerTask('saucelabs', ['test', 'saucelabs-qunit']);
    grunt.registerTask('preview', ['connect', 'watch']);
};
