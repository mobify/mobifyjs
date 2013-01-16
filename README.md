# Mobify.js

Mobify.js is a modular javascript library that offers a number of performance and user interface enhancements for any site.

For instructions on how to use the library, follow the instructions on [mobifyjs.com](https://www.mobifyjs.com/)
or build the docs site manually in the instructions below.

## Development

### Building

Mobify.js uses Grunt.js and Require.js to build the library, and manage all of the dependancies.

    git checkout https://github.com/mobify/mobifyjs.git
    npm install
    grunt

Open the ./build folder to see the generated Mobify.js libraries.

Mobify.js uses Require.js mainly to be AMD-compliant, and for dependency management. But we don't use it for dynamic
library loading when developing. In order to build Mobify.js during development without having to run `grunt` everytime
you change a file, run the following command:
    
    grunt watch // TODO: Make this work!

### Tests

TODO - longer writup, and get tests working

    grunt test    

##  Docs

The compiled documentation for Mobify.js can be found online at [mobifyjs.com](https://www.mobifyjs.com/).

To compile the documentation yourself, install [Jekyll](http://jekyllrb.com/)
and run it from `www` folder:

    gem install jekyll
    cd www
    jekyll --server --auto
    
Then navigate to http://localhost:4000/mobifyjs/docs/.


## Build mobifyjs.com

When creating a build of mobifyjs.com for release, execute this command:

    make buildstatic

And then copy the generated "\_site" folder to where the site will be hosted.
