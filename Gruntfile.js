// http://stackoverflow.com/questions/13567312/working-project-structure-that-uses-grunt-js-to-combine-javascript-files-using-r

/*global module:false*/
module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: '<json:package.json>',
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
          files: ['tests/**/*.html']
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
                    name: "mobify-capture",
                    out: "./build/mobify-resizeImages.js",
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
            }
        },
        watch: {
          files: '<config:lint.files>',
          tasks: 'requirejs:full'
        },
    });

    grunt.loadNpmTasks('grunt-requirejs');

    // Default task.
    // grunt.registerTask('default', 'lint qunit requirejs');
    //grunt.registerTask('skiptests', 'concat');
    grunt.registerTask('watch', 'watch');
    grunt.registerTask('default', ['requirejs:capture', 'requirejs:full']);
    grunt.registerTask('capture', 'requirejs:capture');
    grunt.registerTask('full', 'requirejs:full');

};
