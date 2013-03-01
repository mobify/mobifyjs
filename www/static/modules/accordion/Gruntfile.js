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
                dest: 'build/<%= pkg.name %>.<%= pkg.version %>.min.js'
            }
        },
        cssmin: {
            core: {
                src: 'src/accordion.css',
                dest: 'build/accordion.<%= pkg.version %>.min.css'
            },
            style: {
                src: 'src/accordion-style.css',
                dest: 'build/accordion-style.<%= pkg.version %>.min.css'
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
                    dest: "modules/accordion/build/",
                    rel: "build"
                }
            ]
        }
    });

    // Load the plugin that provides the "uglify" task.
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-css');

    // Default task(s).
    grunt.registerTask('default', ['uglify', 'cssmin']);

};