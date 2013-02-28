# Mobify.js

Mobify.js is a library that allows you to make a number of different kinds of adaptations to your existing site for all kinds of different devices.

For instructions on how to use the library, follow the instructions on [mobifyjs.com](https://www.mobifyjs.com/)
or build the docs site manually in the instructions below.

## Development

### Building

Mobify.js uses Grunt.js and Require.js to build the library, and manage all of the dependancies. First, you will need to install the grunt-cli globally:

    npm install -g grunt-cli

And then download the latest code from git and install the dependancies:

    git checkout https://github.com/mobify/mobifyjs.git
    cd mobifyjs
    npm install

Now, to build the library, simply run grunt:

    grunt

Open the ./build folder to see the generated Mobify.js libraries.

Mobify.js uses Require.js mainly for dependency management, we don't use it for dynamic library loading when developing.

In order to build Mobify.js during development without having to run `grunt` everytime you change a file, run the following command:
    
    grunt preview

This will run a development server on http://localhost:3000 using connect.

To see how the project is setup to build, open up `Gruntfile.js` and have a look!

#### Build Setup

Require.js is used to build Mobify.js. 

 - src/config.js # The require.js base config for all build mobify.js builds

There are a number of files that define which modules to load in to build our various libraries.

 - src/mobify-full.js # Defines how to build the full mobify.js library
 - src/mobify-capture.js # Defines how to build the capture library only

There is also an example custom build file to make it simple to build a custom
mobify.js library (or to compile the library with executable code)

 - mobify-custom.js.example

To create a custom build, run the following:

    `cp mobify-custom.js.example mobify-custom.js`

Then, run `grunt preview` as normal. The output of the custom build will be
located in `./build/custom`.

### Tests

Tests for Mobify.js are written in QUnit. To run them individually, run
`grunt preview` and then go to `http://localhost:3000/tests/capture.html`
or any other of the QUnit tests in the /tests/ folder.

To run all of the tests in an automated fashion using Phantomjs
(the headless webkit browser) run the following command:

    grunt test

It's also important when developing not to run into any regressions on all of the
supported browsers. The Gruntfile is setup to be able to run qunit tests
on many browsers we support (in order to do this yourself, you will need a
Saucelabs Connect username and key).

    cp localConfig.js.example localConfig.js
    # Add your Saucelabs username and key to localConfig.js
    grunt saucelabs

## Browser support

 - All Webkit browsers (Safari, Chrome, Netfront, etc)
 - Firefox - version 4 and up
 - Opera - 11 and up (previous versions untested)
 - IE10 - TODO: Explain why not IE9 and previous

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
