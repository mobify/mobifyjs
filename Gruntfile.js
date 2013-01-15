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
        // Building Mobify with Capturing only (dev)
        requirejs: {
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
          tasks: 'lint qunit'
        },
        jshint: {
          options: {
            curly: true,
            eqeqeq: true,
            immed: true,
            latedef: true,
            newcap: true,
            noarg: true,
            sub: true,
            undef: true,
            boss: true,
            eqnull: true,
            browser: true
          },
        },
    });

    grunt.loadNpmTasks('grunt-requirejs');

    // Default task.
    // grunt.registerTask('default', 'lint qunit requirejs');
    //grunt.registerTask('skiptests', 'concat');
    grunt.registerTask('default', ['requirejs:capture', 'requirejs:full']);
    grunt.registerTask('capture', 'requirejs:capture');
    grunt.registerTask('full', 'requirejs:full');

};
