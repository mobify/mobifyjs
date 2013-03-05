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
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= pkg.version %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: 'src/accordion.js',
                dest: 'build/accordion.min.js'
            }
        },
        cssmin: {
            core: {
                src: 'src/accordion.css',
                dest: 'build/accordion.min.css'
            },
            style: {
                src: 'src/accordion-style.css',
                dest: 'build/accordion-style.min.css'
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
                    src: "build/*",
                    dest: "modules/accordion/<%= pkg.version %>/",
                    rel: "build"
                }
            ]
        }
        // TODO: upload over a LATEST version and/or create a redirect?
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-css');

    // Default task(s).
    grunt.registerTask('default', ['uglify', 'cssmin']);

};