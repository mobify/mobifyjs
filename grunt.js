// http://stackoverflow.com/questions/13567312/working-project-structure-that-uses-grunt-js-to-combine-javascript-files-using-r

/*global module:false*/
module.exports = function(grunt) {

    console.log("test");
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
          files: ['grunt.js', 'lib/**/*.js', 'tests/**/*.js']
        },
        qunit: {
          files: ['tests/**/*.html']
        },
        requirejs: {
            compile: {
                options: {
                    almond: true,
                    mainConfigFile: "./src/config.js",
                    optimize: "none",
                    keepBuildDir: true,
                    out: "./build/mobify.js",
                    name: "main",
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
        uglify: {}
    });

    grunt.loadNpmTasks('grunt-requirejs');

    // Default task.
    // grunt.registerTask('default', 'lint qunit requirejs');
    grunt.registerTask('default', 'requirejs');
    //grunt.registerTask('skiptests', 'concat');
    grunt.registerTask('build', 'requirejs');

};
